const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user')
    .addUserOption(option => option.setName('target').setDescription('The user to unban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for unbanning')),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('target', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user.tag;

    // Permissions check: ensure the bot has permission to unban users
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      await interaction.reply({ content: 'I do not have permission to unban users in this server.', ephemeral: true });
      return;
    }

    // Check if the member has permission to unban users
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      await interaction.reply({ content: 'You do not have permission to unban users in this server.', ephemeral: true });
      return;
    }

    try {
      // Check if the user is actually banned
      const ban = await interaction.guild.bans.fetch(user.id);

      if (!ban) {
        await interaction.reply({ content: `User with ID ${user.id} is not banned.`, ephemeral: true });
        return;
      }

      // Unban the user
      await interaction.guild.bans.remove(user.id, reason);
      const caseNumber = caseManager.createCase(user.tag, moderator, 'unban', reason);
      await interaction.reply({ content: `Unbanned ${user.tag} for: ${reason}. Case #${caseNumber}`, ephemeral: true });
    } catch (error) {
      if (error.code === 10026) {
        await interaction.reply({ content: `User with ID ${user.id} is not banned.`, ephemeral: true });
      } else {
        console.error(error);
        await interaction.reply({ content: 'An error occurred while trying to unban the user.', ephemeral: true });
      }
    }
  },
};
