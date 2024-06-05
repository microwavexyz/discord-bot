import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Client, Message } from 'discord.js';
import { Command } from '../types/command';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Define the type for AFK user data
interface AfkUser {
  message: string;
  timestamp: number;
}

// Path to store AFK users
const afkFilePath = path.join(__dirname, '../data/afk.json');

// Ensure the AFK file exists
if (!fs.existsSync(afkFilePath)) {
  fs.writeFileSync(afkFilePath, JSON.stringify({}));
}

// Function to get AFK users
const getAfkUsers = async (): Promise<Record<string, AfkUser>> => {
  try {
    const afkData = await readFile(afkFilePath, 'utf8');
    return JSON.parse(afkData) as Record<string, AfkUser>;
  } catch (error) {
    console.error('Error reading AFK file:', error);
    return {};
  }
}

// Function to save AFK users
const saveAfkUsers = async (afkUsers: Record<string, AfkUser>) => {
  try {
    await writeFile(afkFilePath, JSON.stringify(afkUsers, null, 2));
  } catch (error) {
    console.error('Error writing to AFK file:', error);
  }
}

// Function to notify if mentioned user is AFK
export const notifyIfAfk = async (message: Message) => {
  const afkUsers = await getAfkUsers();
  const notifiedUsers = new Set<string>();

  message.mentions.users.forEach(user => {
    if (afkUsers[user.id] && !notifiedUsers.has(user.id)) {
      const afkUser = afkUsers[user.id];
      const afkTimestamp = new Date(afkUser.timestamp).toLocaleString();
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('User is AFK')
        .setDescription(`${user.tag} is AFK: ${afkUser.message}`)
        .addFields({ name: 'Went AFK at', value: afkTimestamp, inline: true })
        .setTimestamp(new Date(afkUser.timestamp));

      message.channel.send({ embeds: [embed] }).catch(console.error);
      notifiedUsers.add(user.id);
    }
  });
}

// Command definition
export const command: Command = {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Sets your status as AFK or removes it')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Sets your AFK status')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('The AFK message')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Removes your AFK status'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Lists all AFK users')),
  async execute(interaction: ChatInputCommandInteraction) {
    const afkUsers = await getAfkUsers();

    if (interaction.options.getSubcommand() === 'set') {
      const afkMessage = interaction.options.getString('message') || 'AFK';
      afkUsers[interaction.user.id] = {
        message: afkMessage,
        timestamp: Date.now(),
      };
      await saveAfkUsers(afkUsers);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('AFK Status Set')
        .setDescription(`You are now AFK: ${afkMessage}`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (interaction.options.getSubcommand() === 'remove') {
      delete afkUsers[interaction.user.id];
      await saveAfkUsers(afkUsers);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('AFK Status Removed')
        .setDescription('Your AFK status has been removed.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } else if (interaction.options.getSubcommand() === 'list') {
      const afkList = Object.entries(afkUsers).map(([id, { message }]) => `<@${id}>: ${message}`).join('\n') || 'No users are currently AFK.';

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('AFK Users')
        .setDescription(afkList)
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

// Event listener to handle messages and remove AFK status
export const setupAfkHandler = (client: Client) => {
  client.on('messageCreate', async (message: Message) => {
    const afkUsers = await getAfkUsers();
    if (afkUsers[message.author.id]) {
      delete afkUsers[message.author.id];
      await saveAfkUsers(afkUsers);

      const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Welcome Back!')
        .setDescription(`${message.author}, your AFK status has been removed.`)
        .setTimestamp();

      message.channel.send({ embeds: [embed] }).catch(console.error);
    }

    await notifyIfAfk(message);
  });
}
