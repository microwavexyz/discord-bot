import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';
import { getUserBalance } from '../utils/dataHandler';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your balance'),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;

    try {
      const balance = await getUserBalance(userId);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`${interaction.user.tag}'s Balance`)
        .setDescription(`You have ${balance} points.`)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 64 }))
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching user balance:', error);
      await interaction.reply({ content: 'There was an error fetching your balance. Please try again later.', ephemeral: true });
    }
  },
};
