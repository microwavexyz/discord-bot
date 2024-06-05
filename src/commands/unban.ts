import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder, GuildMember } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user')
    .addStringOption(option =>
      option.setName('user')
        .setDescription('The ID of the user to unban')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await sendEmbed(interaction, 0xff0000, 'This command can only be used in a guild.', true);
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && !member.roles.cache.some(role => role.name === 'Moderator')) {
      await sendEmbed(interaction, 0xff0000, 'You do not have permission to use this command.', true);
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      await sendEmbed(interaction, 0xff0000, 'I do not have permission to unban members.', true);
      return;
    }

    const userId = interaction.options.getString('user', true);

    try {
      await interaction.guild.members.unban(userId);
      await sendEmbed(interaction, 0x00ff00, `Successfully unbanned user with ID ${userId}.`);
    } catch (error) {
      console.error('Error unbanning user:', error);
      await sendEmbed(interaction, 0xff0000, 'There was an error while unbanning the user. Please ensure the user ID is correct and try again.', true);
    }
  },
};

/**
 * Sends an embed as a reply to an interaction.
 * @param interaction The interaction object.
 * @param color The color of the embed.
 * @param description The description of the embed.
 * @param ephemeral Whether the reply should be ephemeral.
 */
async function sendEmbed(interaction: ChatInputCommandInteraction, color: number, description: string, ephemeral: boolean = false) {
  const embed = new EmbedBuilder().setColor(color).setDescription(description);
  await interaction.reply({ embeds: [embed], ephemeral });
}
