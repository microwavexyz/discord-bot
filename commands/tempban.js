const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
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
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('User Not Found')
        .setDescription('User not found in the server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to ban members.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      await member.ban({ reason });
      const caseNumber = await caseManager.createCase(target.tag, moderator, 'tempban', reason);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('User Temporarily Banned')
        .setDescription(`${target.tag} has been temporarily banned for ${duration} minutes.`)
        .addField('Reason', reason, true)
        .addField('Case Number', `${caseNumber}`, true)
        .addField('Moderator', moderator, true)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: false });

      setTimeout(async () => {
        await interaction.guild?.members.unban(target.id, 'Temporary ban expired');
      }, duration * 60 * 1000);
    } catch (error) {
      console.error('Error banning the user:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error trying to ban the user.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
