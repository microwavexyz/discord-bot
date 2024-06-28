const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from the server')
    .addUserOption(option => option.setName('target').setDescription('The user to ban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for banning')),
  async execute(interaction) {
    const user = interaction.options.getUser('target', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const moderator = interaction.user;

    if (user.id === moderator.id || !interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers) || !interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      return interaction.reply({ embeds: [createErrorEmbed(user.id === moderator.id ? 'Self-ban Attempt' : 'Permission Denied', user.id === moderator.id ? 'You cannot ban yourself.' : `${interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers) ? 'You do' : 'I do'} not have permission to ban users.`)], ephemeral: true });
    }

    try {
      const member = await interaction.guild.members.fetch(user.id);
      if (!member || !member.bannable) {
        return interaction.reply({ embeds: [createErrorEmbed('Action Denied', member ? 'I cannot ban this user due to role hierarchy.' : 'User not found in this server.')], ephemeral: true });
      }

      const caseNumber = await caseManager.createCase(user.tag, moderator.tag, 'ban', reason);

      await member.send({ embeds: [createDMEmbed(interaction.guild.name, reason, moderator.id, caseNumber)] }).catch(() => console.log(`Failed to send DM to ${user.tag}`));
      await member.ban({ reason });

      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setAuthor({ name: 'User Banned', iconURL: user.displayAvatarURL({ dynamic: true }) })
        .setDescription([
          `**Target:** ${user} (\`${user.tag}\`)`,
          `**Reason:** ${reason}`,
          `**Moderator:** ${moderator} (\`${moderator.tag}\`)`,
          `**Case Number:** \`#${caseNumber}\``
        ].join('\n'))
        .setFooter({ text: `ID: ${user.id}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      return interaction.reply({ embeds: [createErrorEmbed('Error', 'An error occurred while trying to ban the user.')], ephemeral: true });
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

function createDMEmbed(guildName, reason, moderatorId, caseNumber) {
  return new EmbedBuilder()
    .setColor(0xE74C3C)
    .setTitle(`🔨 Banned from ${guildName}`)
    .setDescription([
      `**Reason:** ${reason}`,
      `**Moderator:** <@${moderatorId}>`,
      `**Case Number:** \`#${caseNumber}\``
    ].join('\n'))
    .setTimestamp();
}