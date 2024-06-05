import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmutes a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unmute')
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
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      await sendEmbed(interaction, 0xff0000, 'I do not have permission to unmute members.', true);
      return;
    }

    const user = interaction.options.getMember('user') as GuildMember;

    if (!user) {
      await sendEmbed(interaction, 0xff0000, 'User not found.', true);
      return;
    }

    try {
      await user.timeout(null); // Remove the timeout to unmute the user
      await sendEmbed(interaction, 0x00ff00, `Successfully unmuted ${user.user.tag}.`);
    } catch (error) {
      console.error('Error unmuting user:', error);
      await sendEmbed(interaction, 0xff0000, 'There was an error while unmuting the user. Please try again.', true);
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
