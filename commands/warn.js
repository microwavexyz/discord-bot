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
    const moderator = interaction.user;

    if (user.id === interaction.user.id || user.id === interaction.client.user.id) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Invalid Target')
        .setDescription('You cannot warn yourself or the bot.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

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
      const caseNumber = await caseManager.createCase(user.tag, moderator.tag, 'warn', reason);

      // Send DM to the user being warned
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setDescription(`You have been warned in **${interaction.guild.name}**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>\n**Case Number:** ${caseNumber}`);

      try {
        await user.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.error('Error sending DM:', error);
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setDescription(`⚠️ **<@${user.id}> warned**\n**Reason:** ${reason}\n**Moderator:** <@${moderator.id}>`)
        .setFooter({ text: `Case Number: ${caseNumber}`, iconURL: interaction.client.user.displayAvatarURL() });

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
