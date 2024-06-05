import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, CacheType, GuildMember } from 'discord.js';
import { Command } from '../types/command';
import { scheduleJob } from 'node-schedule';

export const giveaways = new Map<string, Set<string>>(); // Store giveaway entries

const GIVEAWAY_MANAGER_ROLE_ID = '1229643560182091777'; // Replace with your actual giveaway manager role ID

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('startgiveaway')
    .setDescription('Start a giveaway')
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration of the giveaway in minutes')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('prize')
        .setDescription('The prize of the giveaway')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    // Ensure interaction.member is of type GuildMember
    const member = interaction.member as GuildMember;
    
    // Check if the user has the giveaway manager role
    if (!member.roles.cache.has(GIVEAWAY_MANAGER_ROLE_ID)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    const duration = interaction.options.getInteger('duration', true);
    const prize = interaction.options.getString('prize', true);

    // Check if the duration is within a reasonable range
    const maxDuration = 30 * 24 * 60; // 30 days in minutes
    if (duration <= 0 || duration > maxDuration) {
      await interaction.reply({ content: 'Invalid duration. Please set a duration between 1 minute and 30 days.', ephemeral: true });
      return;
    }

    const endTime = new Date(Date.now() + duration * 60000); // Calculate end time

    const giveawayEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🎉 Giveaway Started! 🎉')
      .setDescription(`Prize: **${prize}**\nReact with 🎉 to enter!\nEnds at: ${endTime.toLocaleString()}`)
      .setTimestamp();

    try {
      const message = await interaction.reply({ embeds: [giveawayEmbed], fetchReply: true });

      giveaways.set(message.id, new Set<string>());

      await message.react('🎉');

      scheduleJob(endTime, async () => {
        await endGiveaway(interaction, message.id, prize);
      });
    } catch (error) {
      console.error('Error starting giveaway:', error);
      await interaction.followUp({ content: 'There was an error starting the giveaway. Please try again later.', ephemeral: true });
    }
  },
};

/**
 * Ends the giveaway and announces the winner.
 * @param interaction The interaction object.
 * @param messageId The ID of the giveaway message.
 * @param prize The prize of the giveaway.
 */
async function endGiveaway(interaction: ChatInputCommandInteraction<CacheType>, messageId: string, prize: string) {
  const entries = giveaways.get(messageId);
  if (entries && entries.size > 0) {
    const winnerId = [...entries][Math.floor(Math.random() * entries.size)];
    const winner = await interaction.guild?.members.fetch(winnerId);

    const winnerEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🎉 Giveaway Ended! 🎉')
      .setDescription(`Prize: **${prize}**\nWinner: ${winner?.user.tag}`)
      .setTimestamp();

    await interaction.channel?.send({ embeds: [winnerEmbed] });
  } else {
    await interaction.channel?.send('No valid entries, giveaway cancelled.');
  }

  giveaways.delete(messageId);
}
