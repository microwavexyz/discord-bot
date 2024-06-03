import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';
import { readData, balancesPath } from '../utils/dataHandler';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Displays the leaderboard of users with the highest balances'),
  async execute(interaction: ChatInputCommandInteraction) {
    const data = readData(balancesPath);
    const users = Object.entries(data.users)
      .map(([id, user]) => ({ id, ...user }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('Leaderboard')
      .setDescription(
        users
          .map((user, index) => `**${index + 1}. <@${user.id}>** - ${user.balance} points`)
          .join('\n')
      );

    await interaction.reply({ embeds: [embed] });
  },
};
