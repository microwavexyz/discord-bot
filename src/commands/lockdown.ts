import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder, TextChannel, GuildMember } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Locks down a channel, restricting message sending permissions')
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration of the lockdown (in minutes)')
        .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('This command can only be used in a guild.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('Could not retrieve member information.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('You do not have permission to use this command.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('I do not have permission to manage channels.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const channel = interaction.channel as TextChannel;
    const duration = interaction.options.getString('duration');
    const durationMs = duration ? parseInt(duration) * 60000 : null;

    if (duration && (isNaN(durationMs!) || durationMs! <= 0)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('Please provide a valid duration in minutes.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      const embed = new EmbedBuilder()
        .setColor(0xffa500)
        .setDescription('This channel has been locked down.');

      await interaction.reply({ embeds: [embed] });

      if (durationMs !== null) {
        setTimeout(async () => {
          if (!interaction.guild) return; // Ensure guild is still available
          await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
          const unlockEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setDescription('This channel has been unlocked.');
          await channel.send({ embeds: [unlockEmbed] });
        }, durationMs);
      }
    } catch (error) {
      console.error('Error locking down the channel:', error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('There was an error while locking down the channel.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
