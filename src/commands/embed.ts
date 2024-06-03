import { SlashCommandBuilder, EmbedBuilder, CommandInteraction } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Sends an embedded message'),
  async execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle('Sample Embed')
      .setDescription('This is an example of an embedded message.')
      .setColor(0x00AE86);

    try {
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error sending embedded message:', error);
      await interaction.reply({ content: 'There was an error sending the embedded message. Please try again later.', ephemeral: true });
    }
  },
};
