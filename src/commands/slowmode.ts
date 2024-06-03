import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel, PermissionsBitField, GuildMember } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Sets a slowmode for the current channel')
    .addIntegerOption(option =>
      option.setName('seconds')
        .setDescription('The number of seconds for the slowmode (0 to 21600)')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const seconds = interaction.options.getInteger('seconds', true);

    if (!interaction.channel || !(interaction.channel instanceof TextChannel)) {
      await sendReply(interaction, 'This command can only be used in a text channel.', true);
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member || !interaction.guild) {
      await sendReply(interaction, 'There was an error retrieving member or guild information.', true);
      return;
    }

    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      await sendReply(interaction, 'You do not have permission to manage channels.', true);
      return;
    }

    if (seconds < 0 || seconds > 21600) {
      await sendReply(interaction, 'The slowmode duration must be between 0 and 21600 seconds.', true);
      return;
    }

    try {
      await interaction.channel.setRateLimitPerUser(seconds);
      await interaction.reply(`Set slowmode to ${seconds} seconds.`);
    } catch (error) {
      console.error('Error setting slowmode:', error);
      await sendReply(interaction, 'There was an error setting the slowmode. Please try again later.', true);
    }
  },
};

/**
 * Sends a reply to an interaction.
 * @param interaction The interaction object.
 * @param content The content of the reply.
 * @param ephemeral Whether the reply should be ephemeral.
 */
async function sendReply(interaction: ChatInputCommandInteraction, content: string, ephemeral: boolean = false) {
  await interaction.reply({ content, ephemeral });
}
