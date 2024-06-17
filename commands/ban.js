const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user')
    .addUserOption(option => option.setName('target').setDescription('The user to ban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for banning')),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('target', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user.tag;

     
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      await interaction.reply({ content: 'I do not have permission to ban users in this server.', ephemeral: true });
      return;
    }

     
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      await interaction.reply({ content: 'You do not have permission to ban users in this server.', ephemeral: true });
      return;
    }

    try {
      const member = await interaction.guild?.members.fetch(user.id);
      if (!member) {
        await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        return;
      }

       
      if (!member.bannable) {
        await interaction.reply({ content: 'I cannot ban this user due to role hierarchy.', ephemeral: true });
        return;
      }

      await member.ban({ reason });
      const caseNumber = caseManager.createCase(user.tag, moderator, 'ban', reason);
      await interaction.reply(`Banned ${user.tag} for: ${reason}. Case #${caseNumber}`);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'An error occurred while trying to ban the user.', ephemeral: true });
    }
  },
};
