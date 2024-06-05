import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionsBitField,
  EmbedBuilder,
  TextChannel,
  GuildMember,
} from 'discord.js';
import { Command } from '../types/command';

const logChannelId = '1245465827772338176'; // Replace with your actual log channel ID
const nukeNotificationColor = 0xffa500;
const nukeSuccessColor = 0x00ff00;
const nukeErrorColor = 0xff0000;
const logEmbedColor = 0x0000ff;

const cooldowns = new Set<string>();

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Deletes the channel and creates a new one with the same properties'),
  async execute(interaction: ChatInputCommandInteraction) {
    // Ensure the command is used in a guild
    if (!interaction.guild) {
      await interaction.reply({ embeds: [createEmbed(nukeErrorColor, 'This command can only be used in a guild.')], ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember;
    const botMember = interaction.guild.members.me;

    // Check user permissions
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      await interaction.reply({ embeds: [createEmbed(nukeErrorColor, 'You do not have permission to use this command.')], ephemeral: true });
      return;
    }

    // Check bot permissions
    if (!botMember?.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      await interaction.reply({ embeds: [createEmbed(nukeErrorColor, 'I do not have permission to manage channels.')], ephemeral: true });
      return;
    }

    const channel = interaction.channel as TextChannel;
    const position = channel.position;
    const oldChannelId = channel.id;

    // Check cooldown
    if (cooldowns.has(oldChannelId)) {
      await interaction.reply({ embeds: [createEmbed(nukeErrorColor, 'This command is on cooldown. Please wait before using it again.')], ephemeral: true });
      return;
    }

    try {
      // Add channel to cooldown set
      cooldowns.add(oldChannelId);

      // Notify about nuke
      await interaction.reply({ embeds: [createEmbed(nukeNotificationColor, 'This channel will be nuked in 5 seconds. Please stand by...')], ephemeral: true });

      // Delay for 5 seconds
      await delay(5000);

      // Clone and delete channel, then set position
      const newChannel = await channel.clone();
      await channel.delete();
      await newChannel.setPosition(position);

      // Send success message
      await newChannel.send({ embeds: [createEmbed(nukeSuccessColor, 'Successfully nuked the channel.')] });

      // Log the action
      await logNukeAction(interaction, member, oldChannelId, newChannel.id);
    } catch (error) {
      console.error('Error nuking the channel:', error);

      const errorMessage = 'There was an error while trying to nuke the channel.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [createEmbed(nukeErrorColor, errorMessage)], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [createEmbed(nukeErrorColor, errorMessage)], ephemeral: true });
      }
    } finally {
      // Remove from cooldown after 10 seconds
      setTimeout(() => cooldowns.delete(oldChannelId), 10000);
    }
  },
};

/**
 * Creates an embed with the specified color and description.
 * @param color - The color of the embed.
 * @param description - The description of the embed.
 * @returns {EmbedBuilder} - The created embed.
 */
function createEmbed(color: number, description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setDescription(description);
}

/**
 * Delays execution for a given number of milliseconds.
 * @param ms - The duration to delay in milliseconds.
 * @returns {Promise<void>} - A promise that resolves after the specified duration.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Logs the nuke action to the specified log channel.
 * @param interaction - The interaction object.
 * @param member - The member who executed the command.
 * @param oldChannelId - The ID of the old channel.
 * @param newChannelId - The ID of the new channel.
 */
async function logNukeAction(interaction: ChatInputCommandInteraction, member: GuildMember, oldChannelId: string, newChannelId: string): Promise<void> {
  const logChannel = interaction.guild?.channels.cache.get(logChannelId) as TextChannel | undefined;

  if (logChannel) {
    const logEmbed = new EmbedBuilder()
      .setColor(logEmbedColor)
      .setTitle('Channel Nuked')
      .addFields(
        { name: 'Old Channel ID', value: oldChannelId, inline: true },
        { name: 'New Channel ID', value: newChannelId, inline: true },
        { name: 'Actioned By', value: member.user.tag, inline: true }
      )
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });
  } else {
    console.warn(`Log channel with ID "${logChannelId}" not found.`);
  }
}
