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
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('This command can only be used in a guild.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.Administrator) && !member.roles.cache.some(role => role.name === 'Moderator')) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('You do not have permission to use this command.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('I do not have permission to unmute members.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const user = interaction.options.getMember('user') as GuildMember;

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('User not found.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      await user.timeout(null); // Remove the timeout to unmute the user
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setDescription(`Successfully unmuted ${user.user.tag}.`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error unmuting user:', error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('There was an error while unmuting the user. Please try again.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
