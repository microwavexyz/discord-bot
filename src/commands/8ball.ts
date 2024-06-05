import { SlashCommandBuilder, ChatInputCommandInteraction, Client, CommandInteraction, CacheType } from 'discord.js';
import { Command } from '../types/command';

const responses = [
  "It is certain.",
  "It is decidedly so.",
  "Without a doubt.",
  "Yes – definitely.",
  "You may rely on it.",
  "As I see it, yes.",
  "Most likely.",
  "Outlook good.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful.",
  "Absolutely!",
  "Certainly not.",
  "It's a mystery.",
  "Only time will tell.",
  "Highly unlikely.",
  "I wouldn't bet on it."
];

const cooldowns = new Set<string>();

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption(option => 
      option.setName('question')
        .setDescription('The question you want to ask')
        .setRequired(true)),
  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.user.id;
    if (cooldowns.has(userId)) {
      await interaction.reply({ content: 'You are using this command too frequently. Please wait a moment before trying again.', ephemeral: true });
      return;
    }
    
    try {
      const question = interaction.options.getString('question');
      if (!question) {
        await interaction.reply({ content: 'You must ask a question!', ephemeral: true });
        return;
      }
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      await interaction.deferReply();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Adds a small delay for a more realistic response
      await interaction.editReply(`🎱 You asked: "${question}"\n${response}`);
      
      // Add user to cooldown set
      cooldowns.add(userId);
      setTimeout(() => cooldowns.delete(userId), 10000); // Cooldown of 10 seconds
    } catch (error) {
      console.error('Error executing 8ball command:', error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  },
};
