import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { Command } from '../types/command';

const configPath = path.join(__dirname, '../data/welcomeConfig.json');
let welcomeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const saveConfig = () => {
  fs.writeFileSync(configPath, JSON.stringify(welcomeConfig, null, 2));
};

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('welcomedisable')
    .setDescription('Disable the welcome system'),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      return;
    }

    welcomeConfig.enabled = false;
    saveConfig();

    await interaction.reply({ content: 'Welcome system has been disabled.', ephemeral: true });
  },
};
