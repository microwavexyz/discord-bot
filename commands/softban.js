const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
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
      await member.ban({ reason, deleteMessageDays: 7 });
      await interaction.guild?.members.unban(target.id, 'Softban');
      const caseNumber = await caseManager.createCase(target.tag, moderator, 'softban', reason);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('User Softbanned')
        .setDescription(`${target.tag} has been softbanned.`)
        .addFields(
          { name: 'Reason', value: reason, inline: true },
          { name: 'Case Number', value: `${caseNumber}`, inline: true },
          { name: 'Moderator', value: moderator, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error('Error softbanning the user:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error trying to softban the user.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
