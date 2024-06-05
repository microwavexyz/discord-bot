import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ButtonInteraction } from 'discord.js';
import axios from 'axios';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Asks a random trivia question'),
  async execute(interaction: ChatInputCommandInteraction) {
    try {
      const response = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple');
      const { question, correct_answer, incorrect_answers } = response.data.results[0];
      const answers = [correct_answer, ...incorrect_answers].sort(() => Math.random() - 0.5);

      const embed = new EmbedBuilder()
        .setTitle('Trivia Question')
        .setDescription(`**${question}**\n\n${answers.map((answer, i) => `**${i + 1}.** ${answer}`).join('\n')}`)
        .setTimestamp();

      const buttons = answers.map((answer, i) =>
        new ButtonBuilder()
          .setCustomId(`answer_${i + 1}`)
          .setLabel(`${i + 1}`)
          .setStyle(ButtonStyle.Primary)
      );

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);

      const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

      const filter = (btnInteraction: ButtonInteraction) => btnInteraction.user.id === interaction.user.id;

      const collector = message.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: 15000, // 15 seconds to answer
      });

      collector.on('collect', async (btnInteraction) => {
        const selectedAnswerIndex = parseInt(btnInteraction.customId.split('_')[1]) - 1;
        const selectedAnswer = answers[selectedAnswerIndex];

        if (selectedAnswer === correct_answer) {
          await btnInteraction.reply({ content: 'Correct!', ephemeral: true });
        } else {
          await btnInteraction.reply({ content: `Incorrect! The correct answer was **${correct_answer}**.`, ephemeral: true });
        }

        await interaction.editReply({ embeds: [createResultEmbed(question, correct_answer, selectedAnswer)], components: [] });
        collector.stop();
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.editReply({ content: 'Time\'s up! No answer was selected.', embeds: [], components: [] });
        }
      });
    } catch (error) {
      console.error('Error fetching trivia question:', error);
      await interaction.reply('Failed to fetch trivia question. Please try again later.');
    }
  },
};

/**
 * Creates an embed showing the result of the trivia question.
 * @param question The trivia question.
 * @param correctAnswer The correct answer.
 * @param selectedAnswer The answer selected by the user.
 * @returns The created EmbedBuilder.
 */
function createResultEmbed(question: string, correctAnswer: string, selectedAnswer: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('Trivia Result')
    .setDescription(`**Question:** ${question}\n\n**Correct Answer:** ${correctAnswer}\n**Your Answer:** ${selectedAnswer}`)
    .setTimestamp()
    .setColor(correctAnswer === selectedAnswer ? 'Green' : 'Red');
}
