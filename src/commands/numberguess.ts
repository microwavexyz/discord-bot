import { SlashCommandBuilder, CommandInteraction, CacheType, CommandInteractionOptionResolver, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';

const activeGames = new Map<string, { number: number, attempts: number, guesses: number[] }>();

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('guessnumber')
    .setDescription('Guess the number between 1 and 100!')
    .addIntegerOption(option =>
      option.setName('guess')
        .setDescription('Your guess')
        .setRequired(true)),
  async execute(interaction: CommandInteraction<CacheType>) {
    const userId = interaction.user.id;
    const options = interaction.options as CommandInteractionOptionResolver;
    const guess = options.getInteger('guess', true);

    let embed: EmbedBuilder;

    try {
      if (!activeGames.has(userId)) {
        const number = Math.floor(Math.random() * 100) + 1;
        activeGames.set(userId, { number, attempts: 0, guesses: [] });
        embed = new EmbedBuilder()
          .setTitle('Guess the Number')
          .setDescription('A new game has started! Try to guess the number between 1 and 100.')
          .setColor(0x00AE86);
      } else {
        const game = activeGames.get(userId)!;
        game.attempts++;
        game.guesses.push(guess);

        if (guess === game.number) {
          embed = new EmbedBuilder()
            .setTitle('Guess the Number')
            .setDescription(`Congratulations! You guessed the number ${game.number} in ${game.attempts} attempts!`)
            .addFields({ name: 'Your Guesses', value: game.guesses.join(', '), inline: true })
            .setColor(0x00AE86);
          activeGames.delete(userId);
        } else if (guess < game.number) {
          embed = new EmbedBuilder()
            .setTitle('Guess the Number')
            .setDescription('Too low! Try again.')
            .addFields({ name: 'Your Guesses', value: game.guesses.join(', '), inline: true })
            .setColor(0x00AE86);
        } else {
          embed = new EmbedBuilder()
            .setTitle('Guess the Number')
            .setDescription('Too high! Try again.')
            .addFields({ name: 'Your Guesses', value: game.guesses.join(', '), inline: true })
            .setColor(0x00AE86);
        }
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error during interaction reply:', error);
      embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('There was an error during the interaction. Please try again later.')
        .setColor(0xFF0000);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
