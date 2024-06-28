const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('Fetches moderation cases for a user or all users')
    .addUserOption(option => option.setName('user').setDescription('The user to fetch cases for'))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers),
  
  async execute(interaction) {
    // Check if the user has permission to view cases
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'You do not have permission to view moderation cases.')], ephemeral: true });
    }

    const user = interaction.options.getUser('user');

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'I do not have permission to read message history in this server.')], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const cases = user ? await caseManager.getCasesByUser(user.tag) : await caseManager.getAllCases();

      if (!cases || cases.length === 0) {
        return interaction.editReply({ embeds: [createInfoEmbed('No Cases Found', user ? `${user.tag} has no cases.` : 'No cases found.', 0x4CAF50)] });
      }

      const pages = createCasePages(cases, user);
      let currentPage = 0;

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pages.length === 1)
        );

      const response = await interaction.editReply({ embeds: [pages[0]], components: [row] });

      const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 }); // 5 minutes

      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ content: 'You can\'t use these buttons.', ephemeral: true });
        }

        await i.deferUpdate();

        if (i.customId === 'previous') {
          currentPage = Math.max(0, currentPage - 1);
        } else if (i.customId === 'next') {
          currentPage = Math.min(pages.length - 1, currentPage + 1);
        }

        row.components[0].setDisabled(currentPage === 0);
        row.components[1].setDisabled(currentPage === pages.length - 1);

        await i.editReply({ embeds: [pages[currentPage]], components: [row] });
      });

      collector.on('end', () => {
        row.components.forEach(button => button.setDisabled(true));
        interaction.editReply({ components: [row] }).catch(console.error);
      });

    } catch (error) {
      console.error('Error fetching cases:', error);
      return interaction.editReply({ embeds: [createErrorEmbed('Error', 'There was an error trying to fetch cases.')] });
    }
  },
};

function createCasePages(cases, user) {
  const casesPerPage = 5;
  const pages = [];

  for (let i = 0; i < cases.length; i += casesPerPage) {
    const currentCases = cases.slice(i, i + casesPerPage);
    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(user ? `📁 Cases for ${user.tag}` : '📁 All Cases')
      .setDescription(currentCases.map((c, index) => formatCase(c, i + index + 1)).join('\n\n'))
      .setFooter({ text: `Page ${Math.floor(i / casesPerPage) + 1}/${Math.ceil(cases.length / casesPerPage)}` })
      .setTimestamp();

    pages.push(embed);
  }

  return pages;
}

function formatCase(c, caseNumber) {
  return [
    `**Case #${caseNumber}**`,
    `👤 **User:** ${c.user}`,
    `🛡️ **Moderator:** ${c.moderator}`,
    `🔨 **Action:** ${c.command}`,
    `💬 **Reason:** ${c.reason}`,
    `🕒 **Date:** <t:${Math.floor(new Date(c.timestamp).getTime() / 1000)}:R>`
  ].join('\n');
}

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setTimestamp();
}

function createInfoEmbed(title, description, color) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description)
    .setTimestamp();
}