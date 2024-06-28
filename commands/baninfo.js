const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('baninfo')
    .setDescription('Displays information about banned users')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers),

  async execute(interaction) {
    // Check if the user has permission to view bans
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'You do not have permission to view banned users.')], ephemeral: true });
    }

    // Check if the bot has permission to view bans
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({ embeds: [createErrorEmbed('Permission Denied', 'I do not have permission to view banned users in this server.')], ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const bans = await interaction.guild.bans.fetch();

      if (!bans.size) {
        return interaction.editReply({ embeds: [createInfoEmbed('No Banned Users', 'There are currently no banned users in this server.', 0x4CAF50)] });
      }

      const banList = bans.map((ban, index) => {
        return `\`${(index + 1).toString().padStart(2, '0')}\` **${ban.user.tag}**\n💬 ${ban.reason || 'No reason provided'}`;
      }).join('\n\n');

      const totalPages = Math.ceil(bans.size / 10);
      const pages = [];

      for (let i = 0; i < totalPages; i++) {
        const start = i * 10;
        const end = start + 10;
        const pageContent = banList.split('\n\n').slice(start, end).join('\n\n');

        const embed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setTitle(`🔨 Banned Users (${bans.size})`)
          .setDescription(pageContent)
          .setFooter({ text: `Page ${i + 1}/${totalPages} • Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
          .setTimestamp();

        pages.push(embed);
      }

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

      const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

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
      console.error('Error fetching ban info:', error);
      return interaction.editReply({ embeds: [createErrorEmbed('Error', 'There was an error fetching the ban information.')] });
    }
  },
};

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