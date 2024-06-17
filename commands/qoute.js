const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Fetches a random quote'),
  async execute(interaction) {
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    try {
      const response = await axios.get('https://api.quotable.io/random');
      const quote = response.data;

      const embed = new EmbedBuilder()
        .setTitle('Random Quote')
        .setDescription(`"${quote.content}"\n\n— ${quote.author}`)
        .setColor(0x00FF00)
        .setFooter({ text: 'Have a great day!', iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching quote:', error);
      await interaction.reply({ content: 'Could not fetch quote. Please try again later.', ephemeral: true });
    }
  },
};
