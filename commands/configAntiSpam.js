const { SlashCommandBuilder } = require('@discordjs/builders');
const AntiSpamSettings = require('../models/AntiSpamSettings');

const authorizedUsers = ['452636692537540608', 'USER_ID_2'];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configantispam')
    .setDescription('Configure the anti-spam settings')
    .addIntegerOption(option =>
      option.setName('threshold')
        .setDescription('Number of messages to consider spam')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('timeframe')
        .setDescription('Time frame for detecting spam in milliseconds')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;

    // Check if the user is authorized
    if (!authorizedUsers.includes(userId)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const guildId = interaction.guild.id;
    const threshold = interaction.options.getInteger('threshold');
    const timeFrame = interaction.options.getInteger('timeframe');

    try {
      let settings = await AntiSpamSettings.findOne({ guildId });

      if (!settings) {
        settings = new AntiSpamSettings({
          guildId,
          threshold,
          timeFrame,
        });
      } else {
        settings.threshold = threshold;
        settings.timeFrame = timeFrame;
      }

      await settings.save();

      await interaction.reply('Anti-spam settings updated successfully!');
    } catch (error) {
      console.error('Error updating anti-spam settings:', error);
      await interaction.reply({ content: 'There was an error updating the anti-spam settings. Please try again later.', ephemeral: true });
    }
  },
};
