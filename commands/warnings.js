const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const caseManager = require('../utils/casemanager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Displays warnings for a user')
    .addUserOption(option => option.setName('user').setDescription('The user to display warnings for').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('I do not have permission to read warnings in this server.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const warnings = await caseManager.getWarnings(user.id);

      if (!warnings || warnings.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('No Warnings')
          .setDescription(`${user.tag} has no warnings.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Warnings for ${user.tag}`)
        .setColor(0xFFA500)
        .setDescription(warnings.map((warn, index) => `**${index + 1}.** ${warn.reason} - ${new Date(warn.date).toLocaleDateString()}`).join('\n'));

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error retrieving warnings:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error trying to retrieve warnings.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
