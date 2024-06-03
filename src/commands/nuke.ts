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
    // Check if command is used in a guild
    if (!interaction.guild) {
      await interaction.reply({ embeds: [createEmbed(nukeErrorColor, 'This command can only be used in a guild.')], ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember;
    const botMember = interaction.guild.members.me;

    // Check if user has permission to manage channels
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      await interaction.reply({ embeds: [createEmbed(nukeErrorColor, 'You do not have permission to use this command.')], ephemeral: true });
      return;
    }

    // Check if bot has permission to manage channels
    if (!botMember?.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      await interaction.reply({ embeds: [createEmbed(nukeErrorColor, 'I do not have permission to manage channels.')], ephemeral: true });
      return;
    }

    const channel = interaction.channel as TextChannel;
    const position = channel.position;
    const oldChannelId = channel.id;

    // Check if the command is on cooldown
    if (cooldowns.has(oldChannelId)) {
      await interaction.reply({ embeds: [createEmbed(nukeErrorColor, 'This command is on cooldown. Please wait before using it again.')], ephemeral: true });
      return;
    }

    try {
      // Add the channel ID to the cooldown set
      cooldowns.add(oldChannelId);

      // Send notification before nuking the channel
      await interaction.reply({ embeds: [createEmbed(nukeNotificationColor, 'This channel will be nuked in 5 seconds. Please stand by...')], ephemeral: true });

      // Wait for 5 seconds before nuking the channel
      await delay(5000);

      // Clone the channel and delete the old one
      const newChannel = await channel.clone();
      await channel.delete();
      await newChannel.setPosition(position);

      // Send success message in the new channel
      await newChannel.send({ embeds: [createEmbed(nukeSuccessColor, 'Successfully nuked the channel.')] });

      // Log the nuke action
      await logNukeAction(interaction, member, oldChannelId, newChannel.id);
    } catch (error) {
      console.error('Error nuking the channel:', error);

      // Check if the interaction is already replied to avoid "InteractionAlreadyReplied" error
      if (interaction.replied || interaction.deferred) {
        const followUpEmbed = createEmbed(nukeErrorColor, 'There was an error while trying to nuke the channel.');
        await interaction.followUp({ embeds: [followUpEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [createEmbed(nukeErrorColor, 'There was an error while trying to nuke the channel.')], ephemeral: true });
      }
    } finally {
      // Remove the channel ID from the cooldown set after 10 seconds
      setTimeout(() => cooldowns.delete(oldChannelId), 10000);
    }
  },
};

/**
 * Creates an embed with the specified color and description.
 * @param color
 * @param description
 * @returns
 */
function createEmbed(color: number, description: string): EmbedBuilder {
  return new EmbedBuilder().setColor(color).setDescription(description);
}

/**
 * Delays the execution of the code for the specified duration.
 * @param ms The duration to delay in milliseconds.
 * @returns A Promise that resolves after the specified duration.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Logs the nuke action to the specified log channel.
 * @param interaction The interaction object.
 * @param member The member who executed the command.
 * @param oldChannelId The ID of the old channel.
 * @param newChannelId The ID of the new channel.
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
