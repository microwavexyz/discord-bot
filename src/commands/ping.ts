import { SlashCommandBuilder, CommandInteraction, Client, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';
import os from 'os';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong! and provides bot statistics'),
  async execute(interaction: CommandInteraction) {
    const client = interaction.client as Client;

    // Calculate bot uptime
    const totalSeconds = (client.uptime ?? 0) / 1000;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600) % 24;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = Math.floor(totalSeconds % 60);

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);

    // Get server count
    const serverCount = client.guilds.cache.size;

    // Get CPU load
    const cpuLoad = os.loadavg();

    // Create an embed with the bot statistics
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🏓 Pong!')
      .setDescription('Here are some statistics about the bot:')
      .addFields(
        { name: 'Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
        { name: 'Memory Usage', value: `${memoryUsageMB} MB`, inline: true },
        { name: 'Servers', value: `${serverCount}`, inline: true },
        { name: 'CPU Load (1m)', value: `${cpuLoad[0].toFixed(2)}`, inline: true },
        { name: 'CPU Load (5m)', value: `${cpuLoad[1].toFixed(2)}`, inline: true },
        { name: 'CPU Load (15m)', value: `${cpuLoad[2].toFixed(2)}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'Bot Statistics', iconURL: client.user?.avatarURL() ?? '' });

    // Send the embed as a reply
    await interaction.reply({ embeds: [embed] });
  },
};
