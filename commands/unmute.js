const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
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

    // Permissions check: ensure the bot has permission to manage roles
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({ content: 'I do not have permission to manage roles in this server.', ephemeral: true });
      return;
    }

    // Check if the member has permission to manage roles
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles)) {
      await interaction.reply({ content: 'You do not have permission to manage roles in this server.', ephemeral: true });
      return;
    }

    try {
      const member = await interaction.guild?.members.fetch(user.id);
      if (!member) {
        await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        return;
      }

      // Remove the timeout
      await member.timeout(null, reason);
      const caseNumber = caseManager.createCase(user.tag, moderator, 'unmute', reason);
      await interaction.reply({ content: `Unmuted ${user.tag} for: ${reason}. Case #${caseNumber}`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'An error occurred while trying to unmute the user.', ephemeral: true });
    }
  },
};
