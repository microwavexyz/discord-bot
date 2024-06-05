import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('serverstats')
    .setDescription('Displays statistics about the server.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const { guild } = interaction;

    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    try {
      const textChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildText).size;
      const voiceChannels = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildVoice).size;
      const categories = guild.channels.cache.filter(channel => channel.type === ChannelType.GuildCategory).size;
      const boosts = guild.premiumSubscriptionCount || 0;

      const embed = new EmbedBuilder()
        .setTitle(`${guild.name} Server Statistics`)
        .addFields(
          { name: 'Server Name', value: guild.name, inline: true },
          { name: 'Server ID', value: guild.id, inline: true },
          { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
          { name: 'Members', value: `${guild.memberCount}`, inline: true },
          { name: 'Roles', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'Text Channels', value: `${textChannels}`, inline: true },
          { name: 'Voice Channels', value: `${voiceChannels}`, inline: true },
          { name: 'Categories', value: `${categories}`, inline: true },
          { name: 'Boosts', value: `${boosts}`, inline: true },
          { name: 'Created On', value: guild.createdAt.toLocaleDateString(), inline: true },
        )
        .setColor(0x00AE86);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching server stats:', error);
      await interaction.reply({ content: 'There was an error fetching server statistics.', ephemeral: true });
    }
  },
};
