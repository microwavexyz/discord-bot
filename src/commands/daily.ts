import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';
import { getLastClaimed, setLastClaimed, updateUserBalance } from '../utils/dataHandler';

const DAILY_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward'),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const now = Date.now();
    const lastClaimed = getLastClaimed(userId);

    if (now - lastClaimed < DAILY_COOLDOWN) {
      const remainingTime = DAILY_COOLDOWN - (now - lastClaimed);
      const hours = Math.floor(remainingTime / (60 * 60 * 1000));
      const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
      await interaction.reply({ content: `You have already claimed your daily reward. Please wait ${hours} hours and ${minutes} minutes before claiming again.`, ephemeral: true });
      return;
    }

    const reward = 100; // Example reward amount

    try {
      updateUserBalance(userId, reward);
      setLastClaimed(userId, now);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setDescription(`You have claimed your daily reward of ${reward} coins.`);

      await interaction.reply({ embeds: [embed] });

      console.log(`Daily reward claimed by ${interaction.user.username} (${userId}).`);
    } catch (error) {
      console.error('Error executing daily command:', error);
      await interaction.reply({ content: 'There was an error claiming your daily reward.', ephemeral: true });
    }
  },
};
