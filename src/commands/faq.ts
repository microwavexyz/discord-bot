import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { Command } from '../types/command';

// Predefined FAQs
const faqs: Record<string, string> = {
  "What is this server about?": "This server is a community for discussing various topics and having fun!",
  "How do I get a role?": "You can get roles by participating in the community and through specific events.",
  "Who are the moderators?": "Moderators are users with special permissions to help manage the server. You can identify them by their roles.",
  "How do I report an issue?": "You can report issues by contacting a moderator or using the /report command.",
  "What are the server rules?": "The server rules can be found in the #rules channel. Please read them carefully.",
};

// Dynamic FAQ management commands
export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('faq')
    .setDescription('Frequently Asked Questions')
    .addSubcommand(subcommand =>
      subcommand.setName('ask')
        .setDescription('Ask an FAQ')
        .addStringOption(option =>
          option.setName('question')
            .setDescription('The question')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('add')
        .setDescription('Add a new FAQ')
        .addStringOption(option =>
          option.setName('question')
            .setDescription('The question')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('answer')
            .setDescription('The answer')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('update')
        .setDescription('Update an existing FAQ')
        .addStringOption(option =>
          option.setName('question')
            .setDescription('The question')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('answer')
            .setDescription('The new answer')
            .setRequired(true))),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const question = interaction.options.getString('question', true);

    switch (subcommand) {
      case 'add':
      case 'update':
        await handleAddOrUpdateFAQ(interaction, subcommand, question);
        break;
      case 'ask':
        await handleAskFAQ(interaction, question);
        break;
      default:
        await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
    }
  },
};

async function handleAddOrUpdateFAQ(interaction: ChatInputCommandInteraction, subcommand: string, question: string) {
  if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)) {
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription('You do not have permission to manage FAQs.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const answer = interaction.options.getString('answer', true);

  if (subcommand === 'add') {
    if (faqs[question]) {
      await interaction.reply({ content: 'This FAQ already exists. Use the update subcommand to modify it.', ephemeral: true });
      return;
    }
    faqs[question] = answer;
    await interaction.reply({ content: 'FAQ added successfully.', ephemeral: true });
  } else if (subcommand === 'update') {
    if (!faqs[question]) {
      await interaction.reply({ content: 'This FAQ does not exist. Use the add subcommand to create it.', ephemeral: true });
      return;
    }
    faqs[question] = answer;
    await interaction.reply({ content: 'FAQ updated successfully.', ephemeral: true });
  }
}

async function handleAskFAQ(interaction: ChatInputCommandInteraction, question: string) {
  const answer = faqs[question] || "Sorry, I don't have an answer for that question.";

  const faqEmbed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('Frequently Asked Questions')
    .setDescription(`**Question:** ${question}\n\n**Answer:** ${answer}`);

  try {
    await interaction.reply({ embeds: [faqEmbed] });
  } catch (error) {
    console.error('Error sending FAQ embed:', error);
    await interaction.reply({ content: 'There was an error retrieving the FAQ. Please try again later.', ephemeral: true });
  }
}
