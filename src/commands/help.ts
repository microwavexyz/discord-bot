import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  MessageComponentInteraction,
} from 'discord.js';
import { Command } from '../types/command';

const commandsPerPage = 5; // Fewer commands per page for a cleaner look
const commandList = [
  { name: 'addMoney', description: 'Adds money to a user\'s balance.' },
  { name: 'balance', description: 'Shows the balance of a user.' },
  { name: 'ban', description: 'Bans a user from the server.' },
  { name: 'clear', description: 'Clears messages in a channel.' },
  { name: 'daily', description: 'Claims daily rewards.' },
  { name: 'embed', description: 'Sends an embedded message.' },
  { name: 'faq', description: 'Shows frequently asked questions.' },
  { name: 'help', description: 'Displays a list of available commands.' },
  { name: 'kick', description: 'Kicks a user from the server.' },
  { name: 'leaderboard', description: 'Shows the leaderboard of users based on their balance.' },
  { name: 'lockdown', description: 'Locks down a channel.' },
  { name: 'meme', description: 'Sends a random meme.' },
  { name: 'mute', description: 'Mutes a user.' },
  { name: 'newCommand', description: 'Template for a new command.' },
  { name: 'nuke', description: 'Deletes all messages in a channel.' },
  { name: 'ping', description: 'Checks the bot\'s latency.' },
  { name: 'poll', description: 'Creates a poll.' },
  { name: 'reactionrole', description: 'Sets up a reaction role message.' },
  { name: 'reminder', description: 'Sets a reminder.' },
  { name: 'role', description: 'Adds or removes a role from a user.' },
  { name: 'serverstats', description: 'Displays server statistics.' },
  { name: 'ticketPanel', description: 'Creates a panel for users to create support tickets.' },
  { name: 'ticketrename', description: 'Renames the current ticket channel.' },
  { name: 'transfer', description: 'Transfers money between users.' },
  { name: 'unban', description: 'Unbans a user from the server.' },
  { name: 'unmute', description: 'Unmutes a user.' },
  { name: 'userinfo', description: 'Displays information about a user.' },
  { name: 'warn', description: 'Warns a user.' },
  { name: 'welcomeDisable', description: 'Disables the welcome message.' },
  { name: 'welcomeEnable', description: 'Enables the welcome message.' },
];

const generateEmbed = (page: number): EmbedBuilder => {
  const start = (page - 1) * commandsPerPage;
  const end = start + commandsPerPage;
  const commandsToShow = commandList.slice(start, end);

  const embed = new EmbedBuilder()
    .setColor(0x5865F2) // Use Discord's blurple color for consistency
    .setTitle('Help - List of Commands')
    .setDescription('Navigate through the commands using the buttons below.')
    .addFields(
      commandsToShow.map((command) => ({
        name: `/${command.name}`,
        value: command.description,
      }))
    )
    .setFooter({ text: `Page ${page} of ${Math.ceil(commandList.length / commandsPerPage)}` });

  return embed;
};

export const command: Command = {
  data: new SlashCommandBuilder().setName('help').setDescription('Displays a list of available commands'),
  async execute(interaction: ChatInputCommandInteraction) {
    let currentPage = 1;
    const totalPages = Math.ceil(commandList.length / commandsPerPage);

    const embed = generateEmbed(currentPage);

    const prevButton = new ButtonBuilder()
      .setCustomId('prev_page')
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 1);

    const nextButton = new ButtonBuilder()
      .setCustomId('next_page')
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === totalPages);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);

    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000, // Collector will stop after 60 seconds
    });

    collector.on('collect', async (buttonInteraction: MessageComponentInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({ content: 'You cannot interact with this button.', ephemeral: true });
        return;
      }

      if (buttonInteraction.customId === 'prev_page' && currentPage > 1) {
        currentPage--;
      } else if (buttonInteraction.customId === 'next_page' && currentPage < totalPages) {
        currentPage++;
      }

      const newEmbed = generateEmbed(currentPage);
      const newPrevButton = new ButtonBuilder()
        .setCustomId('prev_page')
        .setLabel('◀')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 1);

      const newNextButton = new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages);

      const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(newPrevButton, newNextButton);

      await buttonInteraction.update({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on('end', () => {
      if (message.editable) {
        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          prevButton.setDisabled(true),
          nextButton.setDisabled(true)
        );
        message.edit({ components: [disabledRow] }).catch(console.error);
      }
    });
  },
};
