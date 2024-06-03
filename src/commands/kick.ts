import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder, GuildMember } from 'discord.js';
import { Command } from '../types/command';
import fetch from 'node-fetch';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('This command can only be used in a guild.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember | null;
    if (!member || !member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('You do not have permission to use this command.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const user = interaction.options.getMember('user') as GuildMember;
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('User not found.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (user.permissions.has(PermissionsBitField.Flags.Administrator)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('You cannot kick an administrator.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      await user.kick(reason);
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setDescription(`Kicked ${user.user.tag} for: ${reason}`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('There was an error while trying to kick the user.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
