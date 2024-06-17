const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warns a user')
    .addUserOption(option => option.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for warning').setRequired(true)),
  async execute(interaction) {
    const options = interaction.options;
    const user = options.getUser('user', true);
    const reason = options.getString('reason', true);
    const moderator = interaction.user.tag;

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to warn users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to warn users in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const warningId = await caseManager.addWarning(user.id, reason);
      const caseNumber = await caseManager.createCase(user.tag, moderator, 'warn', reason);

      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('User Warned')
        .setDescription(`Warned ${user.tag} for: ${reason}`)
        .addField('Case Number', `${caseNumber}`, true)
        .addField('Warning ID', `${warningId}`, true)
        .addField('Moderator', `${moderator}`, true)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: false });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error trying to warn the user.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
