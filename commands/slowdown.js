const { SlashCommandBuilder, PermissionsBitField, TextChannel } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowdown')
    .setDescription('Sets a slow mode in the channel')
    .addIntegerOption(option => 
      option.setName('duration')
        .setDescription('The slow mode duration in seconds')
        .setRequired(true)),
  async execute(interaction) {
    const duration = interaction.options.getInteger('duration', true);

    // Check if the command is executed in a text channel
    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
      await interaction.reply({ content: 'This command can only be used in text channels.', ephemeral: true });
      return;
    }

    // Check if the user has permission to manage channels
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageChannels)) {
      await interaction.reply({ content: 'You do not have permission to manage channels.', ephemeral: true });
      return;
    }

    try {
      const channel = interaction.channel;
      await channel.setRateLimitPerUser(duration, `Slow mode set by ${interaction.user.tag}`);
      await interaction.reply(`Set a slow mode of ${duration} seconds in ${channel.name}.`);
    } catch (error) {
      console.error('Error setting slow mode:', error);
      await interaction.reply({ content: 'There was an error setting the slow mode.', ephemeral: true });
    }
  },
};
