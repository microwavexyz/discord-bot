const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Temporarily ban a user.')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The user to ban')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('duration')
        .setDescription('Duration of the ban in minutes')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)),
  async execute(interaction) {
    const options = interaction.options;
    const target = options.getUser('target', true);
    const duration = options.getInteger('duration', true);
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
      await member.ban({ reason });
      const caseNumber = caseManager.createCase(target.tag, moderator, 'tempban', reason);
      await interaction.reply({ content: `${target.tag} has been temporarily banned for ${duration} minutes. Case #${caseNumber}`, ephemeral: true });

      setTimeout(async () => {
        await interaction.guild?.members.unban(target.id, 'Temporary ban expired');
      }, duration * 60 * 1000);
    } catch (error) {
      console.error('Error banning the user:', error);
      await interaction.reply({ content: 'There was an error trying to ban the user.', ephemeral: true });
    }
  }
};
