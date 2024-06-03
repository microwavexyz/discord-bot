import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import chokidar from 'chokidar';
import config from './config.json';
import { loadCommands } from './loadCommands';
import path from 'path';

const commandsPath = path.join(__dirname, 'commands');
let commands = loadCommands(commandsPath);

const rest = new REST({ version: '9' }).setToken(config.token);

const registerCommands = async () => {
  try {
    console.log('(/) Deploying commands...');
    for (const guildId of config.guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, guildId),
        { body: commands },
      );
    }
    console.log('Commands deployed successfully.');
  } catch (error) {
    console.error('Failed to reload application (/) commands:', error);
  }
};

registerCommands();

// Watch for changes in the commands directory
const watcher = chokidar.watch(commandsPath, { persistent: true });

const reloadCommands = () => {
  try {
    commands = loadCommands(commandsPath);
    registerCommands();
  } catch (error) {
    console.error('Error reloading commands:', error);
  }
};

watcher.on('change', (filePath: string) => {
  console.log(`File changed: ${filePath}`);
  reloadCommands();
});

watcher.on('add', (filePath: string) => {
  console.log(`File added: ${filePath}`);
  reloadCommands();
});

watcher.on('unlink', (filePath: string) => {
  console.log(`File removed: ${filePath}`);
  reloadCommands();
});
