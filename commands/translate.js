const { SlashCommandBuilder, CommandInteraction, CommandInteractionOptionResolver } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translates text to a specified language')
    .addStringOption(option => option.setName('text').setDescription('Text to translate').setRequired(true))
    .addStringOption(option => option.setName('target').setDescription('Target language code (e.g., en, es, fr)').setRequired(true)),
  async execute(interaction) {
    const text = interaction.options.getString('text', true);
    const target = interaction.options.getString('target', true);

    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      await interaction.reply({ content: 'Translation service is not configured. Please contact the administrator.', ephemeral: true });
      return;
    }

    try {
      const response = await axios.post('https://translation.googleapis.com/language/translate/v2', null, {
        params: {
          q: text,
          target: target,
          key: process.env.GOOGLE_TRANSLATE_API_KEY,
        }
      });

      const translation = response.data.data.translations[0].translatedText;

      await interaction.reply({ content: `Translation: ${translation}` });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Translation error:', error.response?.data || error.message);
      } else {
        console.error('Unexpected error:', error);
      }
      await interaction.reply({ content: 'Could not translate text. Please try again later.', ephemeral: true });
    }
  },
};