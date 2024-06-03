import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../types/command';

const EMPTY = '⬜';
const PLAYER_X = '❌';
const PLAYER_O = '⭕';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('tic-tac-toe')
    .setDescription('Start a Tic-Tac-Toe game'),

  async execute(interaction: ChatInputCommandInteraction) {
    const board = [
      [EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY],
      [EMPTY, EMPTY, EMPTY]
    ];
    let currentPlayer = PLAYER_X;

    const generateBoard = () => {
      return board.map(row => row.join('')).join('\n');
    };

    const createButtons = () => {
      const rows = board.map((row, rowIndex) => {
        const buttons = row.map((cell, cellIndex) => {
          return new ButtonBuilder()
            .setCustomId(`ttt-${rowIndex}-${cellIndex}`)
            .setLabel(cell)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(cell !== EMPTY);
        });
        return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
      });
      return rows;
    };

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Tic-Tac-Toe')
      .setDescription(`Current Player: ${currentPlayer}\n\n${generateBoard()}`);

    await interaction.reply({ embeds: [embed], components: createButtons() });

    const filter = (i: any) => i.user.id === interaction.user.id;
    const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 60000 });

    collector?.on('collect', async (i: any) => {
      const [_, row, col] = i.customId.split('-');
      board[row][col] = currentPlayer;
      currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Tic-Tac-Toe')
        .setDescription(`Current Player: ${currentPlayer}\n\n${generateBoard()}`);

      await i.update({ embeds: [embed], components: createButtons() });

      if (checkWin(PLAYER_X) || checkWin(PLAYER_O) || checkDraw()) {
        collector.stop();
      }
    });

    const checkWin = (player: string) => {
      for (let i = 0; i < 3; i++) {
        if (board[i].every(cell => cell === player) || board.map(row => row[i]).every(cell => cell === player)) {
          return true;
        }
      }
      return board[0][0] === player && board[1][1] === player && board[2][2] === player ||
             board[0][2] === player && board[1][1] === player && board[2][0] === player;
    };

    const checkDraw = () => {
      return board.flat().every(cell => cell !== EMPTY);
    };

    collector?.on('end', async () => {
      const winner = checkWin(PLAYER_X) ? PLAYER_X : checkWin(PLAYER_O) ? PLAYER_O : null;
      const endEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Tic-Tac-Toe')
        .setDescription(winner ? `Game over! ${winner} wins!` : 'Game over! It\'s a draw!');
      await interaction.editReply({ embeds: [endEmbed], components: [] });
    });
  }
};
