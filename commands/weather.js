const { SlashCommandBuilder, CommandInteraction, CommandInteractionOptionResolver, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Fetches the current weather for a specified location')
    .addStringOption(option => option.setName('location').setDescription('Location to get the weather for').setRequired(true)),
  async execute(interaction) {
    const location = interaction.options.getString('location', true);

    try {
      const response = await axios.get(`http://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=${location}`);
      const weather = response.data;

      const embed = new EmbedBuilder()
        .setTitle(`Weather for ${weather.location.name}, ${weather.location.region}`)
        .setDescription(weather.current.condition.text)
        .addFields(
          { name: 'Temperature', value: `${weather.current.temp_c}°C / ${weather.current.temp_f}°F`, inline: true },
          { name: 'Humidity', value: `${weather.current.humidity}%`, inline: true },
          { name: 'Wind', value: `${weather.current.wind_kph} kph / ${weather.current.wind_mph} mph`, inline: true }
        )
        .setThumbnail(`http:${weather.current.condition.icon}`)
        .setColor(0x00FF00);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Could not fetch weather data. Please try again later.', ephemeral: true });
    }
  },
};
