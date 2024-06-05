import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageComponentInteraction, Interaction } from 'discord.js';
import { Command } from '../types/command';
import { updateUserBalance } from '../utils/dataHandler';

const REWARD_WIN = 50; // Reward for winning
const REWARD_TIE = 10; // Reward for tying

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock, Paper, Scissors with the bot'),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    const choices = ['🪨', '📄', '✂️'];

    // Create buttons for Rock, Paper, Scissors
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('rock')
          .setLabel('🪨 Rock')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('paper')
          .setLabel('📄 Paper')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('scissors')
          .setLabel('✂️ Scissors')
          .setStyle(ButtonStyle.Primary),
      );

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Rock, Paper, Scissors')
      .setDescription('Choose your move!');

    await interaction.reply({ embeds: [embed], components: [row] });

    // Create a message collector to handle the button interaction
    const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 15000 });

    collector?.on('collect', async (i: MessageComponentInteraction) => {
      const userChoice = i.customId;
      const botChoice = choices[Math.floor(Math.random() * choices.length)];

      let result = '';
      let reward = 0;

      if (userChoice === botChoice) {
        result = "It's a tie!";
        reward = REWARD_TIE;
      } else if (
        (userChoice === 'rock' && botChoice === '✂️') ||
        (userChoice === 'paper' && botChoice === '🪨') ||
        (userChoice === 'scissors' && botChoice === '📄')
      ) {
        result = 'You win!';
        reward = REWARD_WIN;
      } else {
        result = 'You lose!';
        reward = 0;
      }

      try {
        if (reward > 0) {
          await updateUserBalance(userId, reward);
        }

        const resultEmbed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Rock, Paper, Scissors')
          .setDescription(`You chose ${userChoice}, I chose ${botChoice}.\n${result}\nYou earned ${reward} coins.`);

        await i.update({
          embeds: [resultEmbed],
          components: []
        });

        console.log(`Rock, Paper, Scissors result for ${interaction.user.username} (${userId}): ${result}. Earned ${reward} coins.`);
      } catch (error) {
        console.error('Error executing Rock, Paper, Scissors command:', error);
        await i.update({ content: 'There was an error processing your game result.', components: [], embeds: [] });
      }

      collector.stop();
    });

    collector?.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          embeds: [new EmbedBuilder().setColor('#ff0000').setTitle('Rock, Paper, Scissors').setDescription('You didn\'t make a move in time!')],
          components: []
        }).catch(console.error);
      }
    });
  },
};
