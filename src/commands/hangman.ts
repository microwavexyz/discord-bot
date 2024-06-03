import { SlashCommandBuilder, EmbedBuilder, CommandInteraction, CommandInteractionOptionResolver, Colors, Message } from 'discord.js';
import { Command } from '../types/command';

const words = ["hangman", "discord", "typescript", "javascript", "bot", "programming"];

let chosenWord = "";
let displayWord = "";
let incorrectGuesses = 0;
let guessedLetters = new Set<string>();
let successfulAttempts = 0;
const maxIncorrectGuesses = 6;
const maxSuccessfulAttempts = 10;

function startNewGame() {
    chosenWord = words[Math.floor(Math.random() * words.length)];
    displayWord = "_ ".repeat(chosenWord.length).trim();
    incorrectGuesses = 0;
    guessedLetters = new Set();
    successfulAttempts = 0;
}

function updateDisplayWord(letter: string) {
    let newDisplayWord = "";
    for (let i = 0; i < chosenWord.length; i++) {
        if (chosenWord[i] === letter) {
            newDisplayWord += letter + " ";
        } else {
            newDisplayWord += displayWord[2 * i] + " ";
        }
    }
    displayWord = newDisplayWord.trim();
}

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName('hangman')
        .setDescription('Play a game of Hangman!')
        .addStringOption(option =>
            option.setName('guess')
                .setDescription('Your guess (a single letter)')
                .setRequired(false)),
    async execute(interaction: CommandInteraction) {
        const guess = (interaction.options as CommandInteractionOptionResolver).getString('guess')?.toLowerCase();
        const messagesToDelete: Message[] = [];

        if (!guess) {
            startNewGame();
            const embed = new EmbedBuilder()
                .setTitle('Hangman Game Started!')
                .setDescription(`Word: \`${displayWord}\`\nIncorrect guesses left: ${maxIncorrectGuesses}`)
                .setColor(Colors.Blue);
            const replyMessage = await interaction.reply({ embeds: [embed], fetchReply: true });
            messagesToDelete.push(replyMessage);

            const filter = (response: Message) => response.author.id === interaction.user.id;
            const collector = replyMessage.channel.createMessageCollector({ filter, time: 60000 });

            collector.on('collect', async (response: Message) => {
                const userGuess = response.content.toLowerCase();
                messagesToDelete.push(response);

                if (userGuess.length !== 1 || !/^[a-z]$/.test(userGuess)) {
                    const warningMessage = await response.reply('Please guess a single letter.');
                    messagesToDelete.push(warningMessage);
                    setTimeout(() => warningMessage.delete(), 5000);
                    return;
                }

                if (guessedLetters.has(userGuess)) {
                    const alreadyGuessedMessage = await response.reply(`You already guessed the letter \`${userGuess}\`. Try a different letter.`);
                    messagesToDelete.push(alreadyGuessedMessage);
                    setTimeout(() => alreadyGuessedMessage.delete(), 5000);
                    return;
                }

                guessedLetters.add(userGuess);

                if (chosenWord.includes(userGuess)) {
                    updateDisplayWord(userGuess);
                    successfulAttempts++;
                    if (!displayWord.includes('_') || successfulAttempts >= maxSuccessfulAttempts) {
                        const winEmbed = new EmbedBuilder()
                            .setTitle('Congratulations!')
                            .setDescription(`You've won! The word was \`${chosenWord}\``)
                            .setColor(Colors.Green);
                        await replyMessage.edit({ embeds: [winEmbed] });
                        collector.stop();
                    } else {
                        const correctEmbed = new EmbedBuilder()
                            .setDescription(`Good guess! \`${displayWord}\`\nIncorrect guesses left: ${maxIncorrectGuesses - incorrectGuesses}`)
                            .setColor(Colors.Blue);
                        await replyMessage.edit({ embeds: [correctEmbed] });
                    }
                } else {
                    incorrectGuesses++;
                    if (incorrectGuesses >= maxIncorrectGuesses) {
                        const loseEmbed = new EmbedBuilder()
                            .setTitle('Game Over!')
                            .setDescription(`You've lost! The word was \`${chosenWord}\``)
                            .setColor(Colors.Red);
                        await replyMessage.edit({ embeds: [loseEmbed] });
                        collector.stop();
                    } else {
                        const incorrectEmbed = new EmbedBuilder()
                            .setDescription(`Incorrect guess. \`${displayWord}\`\nIncorrect guesses left: ${maxIncorrectGuesses - incorrectGuesses}`)
                            .setColor(Colors.Blue);
                        await replyMessage.edit({ embeds: [incorrectEmbed] });
                    }
                }
            });

            collector.on('end', async collected => {
                if (collected.size === 0) {
                    await interaction.followUp('Game ended due to inactivity.');
                }

                // Delete all messages related to the game
                for (const msg of messagesToDelete) {
                    try {
                        await msg.delete();
                    } catch (error) {
                        console.error('Error deleting message:', error);
                    }
                }
            });

        } else {
            await interaction.reply('Please start the game first by using `/hangman` without any guesses.');
        }
    },
};
