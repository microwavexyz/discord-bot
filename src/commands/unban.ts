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
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('I do not have permission to unban members.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const userId = interaction.options.getString('user', true);

    try {
      await interaction.guild.members.unban(userId);
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setDescription(`Successfully unbanned user with ID ${userId}.`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error unbanning user:', error);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription('There was an error while unbanning the user. Please ensure the user ID is correct and try again.');
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
