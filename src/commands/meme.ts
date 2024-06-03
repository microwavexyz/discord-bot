import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { Command } from '../types/command';

function getRandomColor(): number {
  return Math.floor(Math.random() * 16777215); // Generates a random hex color
}

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Fetches a random meme from Reddit'),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const response = await axios.get('https://www.reddit.com/r/memes/random/.json');
      const post = response.data[0]?.data?.children[0]?.data;

      if (!post) {
        throw new Error('No post data found');
      }

      const { title, url, ups, num_comments } = post;

      // Validate if the URL is an image
      if (!url || !url.match(/\.(jpeg|jpg|gif|png)$/)) {
        throw new Error('No image URL found');
      }

      const embed = new EmbedBuilder()
        .setColor(getRandomColor())
        .setTitle(title)
        .setImage(url)
        .setFooter({ text: `👍 ${ups} | 💬 ${num_comments}` });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching meme from Reddit:', error.message);
      } else if (error instanceof Error) {
        console.error('Error:', error.message);
      } else {
        console.error('Unexpected error:', error);
      }
      await interaction.reply({ content: 'There was an error fetching a meme. Please try again later.', ephemeral: true });
    }
  },
};
