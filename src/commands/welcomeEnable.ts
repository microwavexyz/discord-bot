import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { Command } from '../types/command';

const configPath = path.join(__dirname, '../data/welcomeConfig.json');
let welcomeConfig;

try {
  welcomeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Error reading welcomeConfig.json:', error);
  welcomeConfig = { enabled: false };
}

const saveConfig = () => {
  try {
    fs.writeFileSync(configPath, JSON.stringify(welcomeConfig, null, 2));
  } catch (error) {
    console.error('Error writing to welcomeConfig.json:', error);
    throw new Error('Failed to save configuration.');
  }
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('welcomeenable')
    .setDescription('Enable the welcome system'),
  async execute(interaction: ChatInputCommandInteraction) {
    // Check for Administrator permission
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    try {
      // Enable the welcome system and save configuration
      welcomeConfig.enabled = true;
      saveConfig();

      await interaction.reply({ content: 'Welcome system has been enabled.', ephemeral: true });
    } catch (error) {
      console.error('Error enabling welcome system:', error);
      await interaction.reply({ content: 'There was an error enabling the welcome system. Please try again later.', ephemeral: true });
    }
  },
};
