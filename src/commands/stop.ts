import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../types/command';

const queue = new Map<string, any>();

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music'),
  async execute(interaction: ChatInputCommandInteraction) {
    const serverQueue = queue.get(interaction.guildId!);

    if (!serverQueue) {
      await interaction.reply('There is no song that I could stop!');
      return;
    }

    serverQueue.songs = [];
    serverQueue.player.stop();
    await interaction.reply('Stopped the music.');
  },
};
