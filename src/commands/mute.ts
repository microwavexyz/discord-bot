import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder, GuildMember } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mutes a user in the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration of the mute in minutes')
        .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('This command can only be used in a guild.')], ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember | null;
    if (!member?.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('You do not have permission to use this command.')], ephemeral: true });
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember?.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('I do not have permission to mute members.')], ephemeral: true });
      return;
    }

    const user = interaction.options.getMember('user') as GuildMember;
    const duration = interaction.options.getInteger('duration') || 0;

    if (!user) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('User not found.')], ephemeral: true });
      return;
    }

    if (user.permissions.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('You cannot mute an administrator.')], ephemeral: true });
      return;
    }

    if (duration <= 0) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('Please provide a valid duration greater than 0 minutes.')], ephemeral: true });
      return;
    }

    try {
      await user.timeout(duration * 60 * 1000);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription(`Muted ${user.user.tag} for ${duration} minutes.`)] });
    } catch (error) {
      console.error('Error muting user:', error);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('There was an error while trying to mute the user.')], ephemeral: true });
    }
  },
};
