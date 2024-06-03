import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin!'),
  async execute(interaction: CommandInteraction) {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const embed = new EmbedBuilder()
      .setTitle('Coin Flip')
      .setDescription(`The coin landed on: **${result}**!`)
      .setColor(0x00AE86);

    try {
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error flipping the coin:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('There was an error flipping the coin. Please try again later.')
        .setColor(0xFF0000);
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};
