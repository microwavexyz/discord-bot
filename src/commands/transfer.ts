import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';
import { getUserBalance, updateUserBalance } from '../utils/dataHandler';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer coins to another user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to transfer coins to')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('The amount of coins to transfer')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const targetUser = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');

    if (!targetUser) {
      await interaction.reply({ content: 'Target user not found.', ephemeral: true });
      return;
    }

    if (amount === null || amount <= 0) {
      await interaction.reply({ content: 'Please enter a valid amount.', ephemeral: true });
      return;
    }

    try {
      const senderBalance = await getUserBalance(userId);

      if (senderBalance < amount) {
        await interaction.reply({ content: 'You do not have enough coins to complete this transfer.', ephemeral: true });
        return;
      }

      await updateUserBalance(userId, -amount);
      await updateUserBalance(targetUser.id, amount);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setDescription(`You have transferred ${amount} coins to ${targetUser.username}.`);

      await interaction.reply({ embeds: [embed] });

      console.log(`Transfer successful: ${amount} coins from ${userId} to ${targetUser.id}`);
    } catch (error) {
      console.error('Error executing transfer command:', error);
      await interaction.reply({ content: 'There was an error processing the transfer.', ephemeral: true });
    }
  },
};
