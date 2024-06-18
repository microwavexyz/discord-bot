const { SlashCommandBuilder } = require('@discordjs/builders');
const AfkUser = require('../models/AfkUser');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Sets your AFK status')
    .addStringOption(option => option.setName('message').setDescription('AFK message').setRequired(true)),
  async execute(interaction) {
    const message = interaction.options.getString('message', true);

    try {
      await AfkUser.findOneAndUpdate(
        { userId: interaction.user.id },
        { message, timestamp: new Date() },
        { upsert: true, new: true }
      );

      await interaction.reply({ content: `You are now AFK: ${message}`, ephemeral: true });
    } catch (error) {
      console.error('Error setting AFK status:', error);
      await interaction.reply({ content: 'There was an error setting your AFK status.', ephemeral: true });
    }
  },
};
