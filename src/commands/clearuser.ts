import { SlashCommandBuilder, CommandInteraction, PermissionsBitField, TextChannel } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('clearuser')
    .setDescription('Clears a specified number of messages from a specific user.')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user whose messages to clear')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('The number of messages to clear')
        .setRequired(true)),
  async execute(interaction: CommandInteraction) {
    const user = interaction.options.get('user')?.user;
    const amount = interaction.options.get('amount')?.value as number;

    if (!interaction.guild) {
      await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    if (amount < 1 || amount > 100) {
      await interaction.reply({ content: 'You need to input a number between 1 and 100.', ephemeral: true });
      return;
    }

    const channel = interaction.channel;
    if (!channel || !(channel instanceof TextChannel)) {
      await interaction.reply({ content: 'This command can only be used in text channels.', ephemeral: true });
      return;
    }

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const userMessages = messages.filter(msg => msg.author.id === user?.id).first(amount);

      if (userMessages.length === 0) {
        await interaction.reply({ content: `No messages found for ${user?.username}.`, ephemeral: true });
        return;
      }

      await channel.bulkDelete(userMessages, true);

      await interaction.reply({ content: `Successfully deleted ${userMessages.length} messages from ${user?.username}.`, ephemeral: true });
    } catch (error) {
      console.error('Error deleting messages:', error);
      await interaction.reply({ content: 'There was an error trying to delete messages. Please try again later.', ephemeral: true });
    }
  },
};
