const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');

const DOG_API_URL = 'https://api.thedogapi.com/v1/images/search';
const CAT_API_URL = 'https://api.thecatapi.com/v1/images/search';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('petpic')
    .setDescription('Fetches a random pet picture')
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type of pet')
        .setRequired(true)
        .addChoices(
          { name: 'Dog', value: 'dog' },
          { name: 'Cat', value: 'cat' }
        )
    ),
  async execute(interaction) {
    const petType = interaction.options.getString('type', true);

    let apiUrl;
    if (petType === 'dog') {
      apiUrl = DOG_API_URL;
    } else if (petType === 'cat') {
      apiUrl = CAT_API_URL;
    } else {
      await interaction.reply({ content: 'Unknown pet type!', ephemeral: true });
      return;
    }

    try {
      const response = await axios.get(apiUrl);
      const imageUrl = response.data[0].url;

      await interaction.reply({ files: [imageUrl] });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'Failed to fetch pet picture!', ephemeral: true });
    }
  },
};
