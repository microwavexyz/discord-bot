const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user')
    .addUserOption(option => option.setName('target').setDescription('The user to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for kicking')),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('target', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user.tag;

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      await interaction.reply({ content: 'I do not have permission to kick users in this server.', ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.KickMembers)) {
      await interaction.reply({ content: 'You do not have permission to kick users in this server.', ephemeral: true });
      return;
    }

    try {
      const member = await interaction.guild?.members.fetch(user.id);
      if (!member) {
        await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        return;
      }

      if (!member.kickable) {
        await interaction.reply({ content: 'I cannot kick this user due to role hierarchy.', ephemeral: true });
        return;
      }

      await member.kick(reason);
      const caseNumber = caseManager.createCase(user.tag, moderator, 'kick', reason);
      await interaction.reply({ content: `Kicked ${user.tag} for: ${reason}. Case #${caseNumber}`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'An error occurred while trying to kick the user.', ephemeral: true });
    }
  },
};
