const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const AfkUser = require('../models/AfkUser'); // Ensure this path is correct

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Sets your AFK status')
    .addStringOption(option => option.setName('message').setDescription('AFK message').setRequired(true)),
  async execute(interaction) {
    const message = interaction.options.getString('message', true);

    try {
      // Upsert AFK status in the database
      await AfkUser.findOneAndUpdate(
        { userId: interaction.user.id },
        { message, timestamp: new Date() },
        { upsert: true, new: true }
      );

      // Create the embed message
      const embed = new EmbedBuilder()
        .setTitle('AFK Status')
        .setDescription(`You are now AFK: ${message}`)
        .setColor('#00FF00')
        .setTimestamp();

      // Reply with the embed message as ephemeral
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error setting AFK status:', error);
      const embedError = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('There was an error setting your AFK status.')
        .setColor('#FF0000')
        .setTimestamp();
      await interaction.reply({ embeds: [embedError], ephemeral: true });
    }
  },
};
