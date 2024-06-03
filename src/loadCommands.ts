// src/loadCommands.ts
import fs from 'fs';
import path from 'path';

export const loadCommands = (commandsPath: string): any[] => {
  const commands = [];
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      const { command } = require(filePath);
      if (command && command.data) {
        commands.push(command.data.toJSON());
        console.log(`Loaded command from ${file}`);
      } else {
        console.warn(`Command in ${file} is not structured correctly.`);
      }
    } catch (error) {
      console.error(`Error loading command ${file}:`, error);
    }
  }
  return commands;
};
