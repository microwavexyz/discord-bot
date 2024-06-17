const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Softban a user (ban and unban to remove messages).')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The user to softban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the softban')
        .setRequired(false)),
  async execute(interaction) {
    const options = interaction.options;
    const target = options.getUser('target', true);
    const reason = options.getString('reason') || 'No reason provided';
    const moderator = interaction.user.tag;

    const member = await interaction.guild?.members.fetch(target.id).catch(() => null);

    if (!member) {
      await interaction.reply({ content: 'User not found in the server.', ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      await interaction.reply({ content: 'You do not have permission to ban members.', ephemeral: true });
      return;
    }

    try {
      await member.ban({ reason, deleteMessageDays: 7 });
      await interaction.guild?.members.unban(target.id, 'Softban');
      const caseNumber = caseManager.createCase(target.tag, moderator, 'softban', reason);
      await interaction.reply({ content: `${target.tag} has been softbanned. Case #${caseNumber}`, ephemeral: true });
    } catch (error) {
      console.error('Error softbanning the user:', error);
      await interaction.reply({ content: 'There was an error trying to softban the user.', ephemeral: true });
    }
  }
};
