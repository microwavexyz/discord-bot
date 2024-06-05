import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder, TextChannel, GuildMember } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears a specified number of messages')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('The number of messages to clear')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('This command can only be used in a guild.')], ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('You do not have permission to use this command.')], ephemeral: true });
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('I do not have permission to manage messages.')], ephemeral: true });
      return;
    }

    const amount = interaction.options.getInteger('amount');
    if (amount === null || amount < 1 || amount > 100) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('You can delete between 1 and 100 messages at a time.')], ephemeral: true });
      return;
    }

    const channel = interaction.channel as TextChannel;

    try {
      const messages = await channel.bulkDelete(amount, true);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0x00ff00).setDescription(`Successfully deleted ${messages.size} messages.`)], ephemeral: true });
    } catch (error) {
      console.error('Error deleting messages:', error);
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription('There was an error while trying to delete messages.')], ephemeral: true });
    }
  },
};
