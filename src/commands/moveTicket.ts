import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, TextChannel, CategoryChannel, GuildMember } from 'discord.js';
import { Command } from '../types/command';

const categoryIds = {
  low: '1244789552787492976', // Replace with your low priority category ID
  medium: '1244789540451782726', // Replace with your medium priority category ID
  high: '1244789523464851539', // Replace with your high priority category ID
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('moveticket')
    .setDescription('Move a ticket to a different category')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('The category to move the ticket to')
        .setRequired(true)
        .addChoices(
          { name: 'Low', value: 'low' },
          { name: 'Medium', value: 'medium' },
          { name: 'High', value: 'high' },
        )),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel || !(interaction.channel instanceof TextChannel)) {
      await interaction.reply({ content: 'This command can only be used in a text channel within a guild.', ephemeral: true });
      return;
    }

    const member = interaction.member as GuildMember;
    if (!member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      await interaction.reply({ content: 'You do not have permission to manage channels.', ephemeral: true });
      return;
    }

    const channel = interaction.channel as TextChannel;
    const newCategory = interaction.options.getString('category', true) as keyof typeof categoryIds;
    const newCategoryId = categoryIds[newCategory];

    if (!newCategoryId) {
      await interaction.reply({ content: 'Invalid category selected.', ephemeral: true });
      return;
    }

    const categoryChannel = interaction.guild.channels.cache.get(newCategoryId) as CategoryChannel | undefined;
    if (!categoryChannel) {
      await interaction.reply({ content: 'The specified category does not exist.', ephemeral: true });
      return;
    }

    try {
      await channel.setParent(categoryChannel.id, { lockPermissions: false });
      await interaction.reply({ content: `Ticket moved to the ${newCategory} priority category.`, ephemeral: true });
    } catch (error) {
      console.error('Error moving ticket:', error);
      await interaction.reply({ content: 'There was an error moving the ticket. Please try again later.', ephemeral: true });
    }
  },
};
