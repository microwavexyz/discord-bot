import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';
import { getUserBalance, updateUserBalance } from '../utils/dataHandler';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('addmoney')
    .setDescription('Add money to a user\'s balance')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to add money to')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('The amount of money to add')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    if (!user || amount === null) {
      await interaction.reply({ content: 'Invalid user or amount.', ephemeral: true });
      return;
    }

    try {
      await updateUserBalance(user.id, amount); // Assuming async function
      const newBalance = await getUserBalance(user.id); // Assuming async function

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('Balance Updated')
        .setDescription(`${user.username} has been given ${amount} coins.\nNew balance: ${newBalance} coins`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error updating balance:', error);
      await interaction.reply({ content: 'There was an error updating the user balance. Please try again later.', ephemeral: true });
    }
  },
};
