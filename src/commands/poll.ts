import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField, EmbedBuilder } from 'discord.js';
import { Command } from '../types/command';

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('The poll question')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('yesemoji')
        .setDescription('The emoji for yes (default: 👍)')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('noemoji')
        .setDescription('The emoji for no (default: 👎)')
        .setRequired(false)),
  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString('question', true);
    const yesEmoji = interaction.options.getString('yesemoji') || '👍';
    const noEmoji = interaction.options.getString('noemoji') || '👎';

    const botMember = interaction.guild?.members.me;
    if (!botMember?.permissions.has(PermissionsBitField.Flags.AddReactions)) {
      await sendEmbed(interaction, 0xff0000, 'I do not have permission to add reactions.', true);
      return;
    }

    try {
      const pollEmbed = createPollEmbed(question, yesEmoji, noEmoji);
      const pollMessage = await interaction.reply({ embeds: [pollEmbed], fetchReply: true });

      await pollMessage.react(yesEmoji);
      await pollMessage.react(noEmoji);
    } catch (error) {
      console.error('Error creating poll:', error);
      await sendEmbed(interaction, 0xff0000, 'There was an error creating the poll. Please ensure the emojis are valid and try again later.', true);
    }
  },
};

/**
 * Creates an embed for the poll.
 * @param question The poll question.
 * @param yesEmoji The emoji for yes.
 * @param noEmoji The emoji for no.
 * @returns The created EmbedBuilder.
 */
function createPollEmbed(question: string, yesEmoji: string, noEmoji: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x1E90FF) // Custom color for the poll
    .setTitle('📊 Poll')
    .setDescription(question)
    .setFooter({ text: `React with ${yesEmoji} for yes and ${noEmoji} for no` })
    .setTimestamp(); // Adds a timestamp to the poll
}

/**
 * Sends an embed as a reply to an interaction.
 * @param interaction The interaction object.
 * @param color The color of the embed.
 * @param description The description of the embed.
 * @param ephemeral Whether the reply should be ephemeral.
 */
async function sendEmbed(interaction: ChatInputCommandInteraction, color: number, description: string, ephemeral: boolean = false) {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description);
  await interaction.reply({ embeds: [embed], ephemeral });
}
