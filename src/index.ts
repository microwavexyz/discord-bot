import { Client, GatewayIntentBits, Partials, Collection, Message } from 'discord.js';
import config from './config.json';
import { registerEvents } from './events/registerEvents';
import { guildMemberAdd } from './events/guildMemberAdd';
import { guildMemberRemove } from './events/guildMemberRemove';
import { messageDelete } from './events/messageDelete';
import { initializeDataFiles } from './utils/dataHandler';
import { CustomClient } from './types/customClient';
import { badWordFilter } from './events/badWordFilter';
import { registerSpamDetection } from './events/spamDetection';
import { Command } from './types/command';
import { setupAfkHandler } from './commands/afk';
import { startDashboard } from './dashboard'; // Importing startDashboard
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const client: CustomClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
}) as CustomClient;

// Initialize command collection
client.commands = new Collection<string, Command>();

// Load command files
const commandFiles = fs
  .readdirSync(path.join(__dirname, 'commands'))
  .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

for (const file of commandFiles) {
  const { command } = require(`./commands/${file}`);
  if (command && command.data) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`Command in ${file} is not structured correctly.`);
  }
}

// Client ready event
client.once('ready', async () => {
  console.log(`Logged in as ${client.user!.tag}`);
  initializeDataFiles();
  registerEvents(client);
  startDashboard(); // Start the dashboard server
});

// Event listeners
client.on('guildMemberAdd', guildMemberAdd);
client.on('guildMemberRemove', guildMemberRemove);
client.on('messageDelete', messageDelete);

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

// Additional event handlers
badWordFilter(client);
registerSpamDetection(client);

// Setup AFK handler
setupAfkHandler(client);

// Log in to Discord with the bot token
client.login(config.token);

export { client };
