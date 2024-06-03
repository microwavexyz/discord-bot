// src/commands/index.ts
import fs from 'fs';
import path from 'path';
import { Collection } from 'discord.js';

const commands = new Collection();

const commandFiles = fs.readdirSync(path.join(__dirname)).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
  if (file !== 'index.ts') {
    const { command } = require(`./${file}`);
    if (command && command.data && command.execute) {
      commands.set(command.data.name, command);
    } else {
      console.warn(`Command in ${file} is not structured correctly.`);
    }
  }
}

export { commands };
