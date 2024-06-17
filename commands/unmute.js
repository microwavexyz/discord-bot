const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmutes a user')
    .addUserOption(option => option.setName('target').setDescription('The user to unmute').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for unmuting')),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('target', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user.tag;

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to manage roles in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to manage roles in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const member = await interaction.guild?.members.fetch(user.id);
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('User Not Found')
          .setDescription('User not found in this server.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      await member.timeout(null, reason);
      const caseNumber = await caseManager.createCase(user.tag, moderator, 'unmute', reason);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('User Unmuted')
        .setDescription(`Unmuted ${user.tag} for: ${reason}`)
        .addField('Case Number', `${caseNumber}`, true)
        .addField('Moderator', `${moderator}`, true)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('An error occurred while trying to unmute the user.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
