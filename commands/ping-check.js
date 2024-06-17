const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping-check')
    .setDescription('Returns the bot\'s latency'),

  async execute(interaction) {
    try {
      const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });

      const timeTaken = sent.createdTimestamp - interaction.createdTimestamp;

      const embed = new EmbedBuilder()
        .setColor(0x0099ff) 
        .setTitle('Pong!')
        .setDescription('Latency and API Latency Information')
        .addFields(
          { name: 'Latency', value: `${timeTaken}ms`, inline: true },
          { name: 'API Latency', value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Ping Check', iconURL: interaction.client.user.displayAvatarURL() });

      await interaction.editReply({ content: null, embeds: [embed] });
    } catch (error) {
      console.error('Error executing ping-check command:', error);
      await interaction.reply({ content: 'An error occurred while checking the latency. Please try again later.', ephemeral: true });
    }
  },
};
