import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, TextChannel, PermissionsBitField, ChannelType } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ticket-rename')
    .setDescription('Renames the current ticket channel')
    .addStringOption(option =>
      option.setName('newname')
        .setDescription('The new name for the ticket')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await sendEphemeralReply(interaction, 'This command can only be used in a guild.');
      return;
    }

    const member = interaction.member as GuildMember | null;
    if (!member) {
      await sendEphemeralReply(interaction, 'Could not retrieve member information.');
      return;
    }

    if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
      await sendEphemeralReply(interaction, 'This command can only be used in a text channel.');
      return;
    }

    const channel = interaction.channel as TextChannel;

    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      await sendEphemeralReply(interaction, 'You do not have permission to manage channels.');
      return;
    }

    if (!isTicketChannel(channel.name)) {
      await sendEphemeralReply(interaction, 'This command can only be used in a ticket channel.');
      return;
    }

    const newName = interaction.options.getString('newname', true);

    try {
      await renameChannel(channel, newName);
      await interaction.reply({ content: `Channel name changed to: ${newName}` });
    } catch (error) {
      console.error('Error renaming the channel:', error);
      await sendEphemeralReply(interaction, 'There was an error renaming the channel. Please try again later.');
    }
  },
};

/**
 * Sends an ephemeral reply to an interaction.
 * @param interaction The interaction object.
 * @param content The content of the reply.
 */
async function sendEphemeralReply(interaction: ChatInputCommandInteraction, content: string) {
  await interaction.reply({ content, ephemeral: true });
}

/**
 * Checks if a channel name matches the ticket channel pattern.
 * @param channelName The name of the channel.
 * @returns True if the channel name matches the ticket pattern, otherwise false.
 */
function isTicketChannel(channelName: string): boolean {
  const ticketChannelPattern = /^ticket-/;
  return ticketChannelPattern.test(channelName);
}

/**
 * Renames a channel.
 * @param channel The channel to rename.
 * @param newName The new name for the channel.
 */
async function renameChannel(channel: TextChannel, newName: string) {
  console.log(`Renaming channel ${channel.name} to ${newName}`);
  await channel.setName(newName);
  console.log(`Channel name changed successfully to ${newName}`);
}
