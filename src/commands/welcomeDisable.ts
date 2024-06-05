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
  welcomeConfig = { enabled: true };
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
    .setName('welcomedisable')
    .setDescription('Disable the welcome system'),
  async execute(interaction: ChatInputCommandInteraction) {
    // Check for Administrator permission
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    try {
      // Disable the welcome system and save configuration
      welcomeConfig.enabled = false;
      saveConfig();
      
      await interaction.reply({ content: 'Welcome system has been disabled.', ephemeral: true });
    } catch (error) {
      console.error('Error disabling welcome system:', error);
      await interaction.reply({ content: 'There was an error disabling the welcome system. Please try again later.', ephemeral: true });
    }
  },
};
