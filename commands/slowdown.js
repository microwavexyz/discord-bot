const { SlashCommandBuilder, PermissionsBitField, TextChannel, EmbedBuilder } = require('discord.js');

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
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Invalid Channel')
        .setDescription('This command can only be used in text channels.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    // Check if the user has permission to manage channels
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageChannels)) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to manage channels.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      const channel = interaction.channel;
      await channel.setRateLimitPerUser(duration, `Slow mode set by ${interaction.user.tag}`);
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Slow Mode Set')
        .setDescription(`Set a slow mode of ${duration} seconds in ${channel.name}.`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error setting slow mode:', error);
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('Error')
        .setDescription('There was an error setting the slow mode.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
