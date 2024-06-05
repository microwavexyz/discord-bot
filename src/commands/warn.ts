import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, GuildMember, PermissionsBitField } from 'discord.js';
import { Command } from '../types/command';

interface Warning {
  userId: string;
  reason: string;
  date: Date;
}

const warnings: Record<string, Warning[]> = {};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user.')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await sendEmbed(interaction, 0xff0000, 'This command can only be used in a guild.', true);
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      await sendEmbed(interaction, 0xff0000, 'You do not have permission to use this command.', true);
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      await sendEmbed(interaction, 0xff0000, 'I do not have permission to timeout members.', true);
      return;
    }

    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason', true);

    if (!target) {
      await sendEmbed(interaction, 0xff0000, 'User not found.', true);
      return;
    }

    if (reason.length > 1000) {
      await sendEmbed(interaction, 0xff0000, 'The reason for the warning is too long. Please keep it under 1000 characters.', true);
      return;
    }

    if (!warnings[target.id]) {
      warnings[target.id] = [];
    }

    const warning: Warning = {
      userId: target.id,
      reason,
      date: new Date(),
    };

    warnings[target.id].push(warning);

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('User Warned')
      .setDescription(`${target.tag} has been warned.`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Total Warnings', value: `${warnings[target.id].length}`, inline: true },
      );

    await interaction.reply({ embeds: [embed] });

    const warnCount = warnings[target.id].length;
    if (warnCount >= 3) {
      try {
        const guildMember = await interaction.guild.members.fetch(target.id);
        if (guildMember) {
          await guildMember.timeout(10 * 60 * 1000); // Timeout for 10 minutes
          await interaction.followUp({ content: `${target.tag} has been timed out for receiving 3 warnings.` });
        }
      } catch (error) {
        console.error('Error applying timeout:', error);
        await sendEmbed(interaction, 0xff0000, 'There was an error applying the timeout. Please check the user\'s permissions and try again.', true);
      }
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
