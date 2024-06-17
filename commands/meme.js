const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Fetches a random meme'),
  async execute(interaction) {
    if (!interaction.guild?.members.me?.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: 'I need permission to send messages in this channel.', ephemeral: true });
    }

    try {
      const response = await axios.get('https://www.reddit.com/r/memes/random/.json');
      const memeData = response.data[0]?.data?.children?.[0]?.data;

      if (!memeData) {
        await interaction.reply({ content: 'Could not fetch meme. Please try again later.', ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(memeData.title)
        .setImage(memeData.url)
        .setColor(0x00FF00)
        .setFooter({ text: `👍 ${memeData.ups} | 💬 ${memeData.num_comments}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching meme:', error);
      await interaction.reply({ content: 'Could not fetch meme. Please try again later.', ephemeral: true });
    }
  },
};
