const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
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

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to unban users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.BanMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to unban users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const ban = await interaction.guild.bans.fetch(user.id);

      if (!ban) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('User Not Banned')
          .setDescription(`User with ID ${user.id} is not banned.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      await interaction.guild.bans.remove(user.id, reason);
      const caseNumber = await caseManager.createCase(user.tag, moderator, 'unban', reason);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('User Unbanned')
        .setDescription(`Unbanned ${user.tag} for: ${reason}`)
        .addField('Case Number', `${caseNumber}`, true)
        .addField('Moderator', `${moderator}`, true)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      if (error.code === 10026) {
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('User Not Banned')
          .setDescription(`User with ID ${user.id} is not banned.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        console.error(error);
        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('Error')
          .setDescription('An error occurred while trying to unban the user.');
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  },
};
