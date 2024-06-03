import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, CacheType } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Creates a panel for users to create support tickets'),
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    try {
      // Check if the user has the ADMINISTRATOR permission
      if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
        await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        return;
      }

      const embed = createTicketPanelEmbed();
      const row = createTicketPanelButton();

      await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
      console.error('Error executing ticketpanel command:', error);
      await sendErrorReply(interaction, 'There was an error creating the ticket panel. Please try again later.');
    }
  },
};

/**
 * Creates an embed for the ticket panel.
 * @returns The created EmbedBuilder.
 */
function createTicketPanelEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('Purchase Tickets')
    .setDescription('Click the button below to create a purchase ticket.')
    .setTimestamp();
}

/**
 * Creates a button for the ticket panel.
 * @returns The created ActionRowBuilder.
 */
function createTicketPanelButton(): ActionRowBuilder<ButtonBuilder> {
  const button = new ButtonBuilder()
    .setCustomId('create_ticket')
    .setLabel('Create a ticket')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('📩');

  return new ActionRowBuilder<ButtonBuilder>().addComponents(button);
}

/**
 * Sends an error reply to an interaction.
 * @param interaction The interaction object.
 * @param content The content of the error message.
 */
async function sendErrorReply(interaction: ChatInputCommandInteraction<CacheType>, content: string) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content, ephemeral: true });
  } else {
    await interaction.reply({ content, ephemeral: true });
  }
}
