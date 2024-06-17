const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warningsFile = path.join(__dirname, '../data/warnings.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Displays warnings for a user')
    .addUserOption(option => option.setName('user').setDescription('The user to display warnings for').setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;

    // Permissions check: ensure the bot has permission to read message history
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
      await interaction.reply({ content: 'I do not have permission to read warnings in this server.', ephemeral: true });
      return;
    }

    if (!fs.existsSync(warningsFile)) {
      await interaction.reply({ content: `${user.tag} has no warnings.`, ephemeral: true });
      return;
    }

    const warnings = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));

    if (!warnings[user.id] || warnings[user.id].length === 0) {
      await interaction.reply({ content: `${user.tag} has no warnings.`, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`Warnings for ${user.tag}`)
      .setColor(0xff0000)
      .setDescription(warnings[user.id].map((warn, index) => `**${index + 1}.** ${warn.reason} - ${new Date(warn.date).toLocaleDateString()}`).join('\n'));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
