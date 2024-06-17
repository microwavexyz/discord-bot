const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const config = require('./config.json');

const {
    handleChannelDelete,
    handleRoleDelete,
    handleGuildMemberUpdate,
    handleChannelCreate,
    handleRoleCreate,
    handleMessageCreate,
    handleRoleUpdate,
    handleGuildMemberAdd,
    handleChannelUpdate,
    handleWebhookCreate,
    handleWebhookDelete,
    handleWebhookMessage
} = require('./modules/antiNuke');

const { handleMessage: handleSpamMessage } = require('./modules/antiSpam');

const { handleMessage: handleLinkMessage } = require('./modules/antiLink');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});
client.commands = new Collection();

// Load commands
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    if (command.data && command.data.name && command.execute) {
        client.commands.set(command.data.name, command);
    } else {
        console.error(`Command file ${file} is missing required properties`);
    }
}

const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.name && event.execute) {
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    } else {
        console.error(`Event file ${file} is missing required properties`);
    }
}

// Anti-Nuke Event Handlers
const antiNukeHandlers = {
    'channelDelete': handleChannelDelete,
    'roleDelete': handleRoleDelete,
    'guildMemberUpdate': handleGuildMemberUpdate,
    'channelCreate': handleChannelCreate,
    'roleCreate': handleRoleCreate,
    'messageCreate': handleMessageCreate,
    'roleUpdate': handleRoleUpdate,
    'guildMemberAdd': handleGuildMemberAdd,
    'channelUpdate': handleChannelUpdate,
    'webhookUpdate': handleWebhookCreate,
    'webhookDelete': handleWebhookDelete,
    'webhookUpdate': handleWebhookMessage,
};

for (const [event, handler] of Object.entries(antiNukeHandlers)) {
    if (typeof handler === 'function') {
        client.on(event, handler);
    } else {
        console.error(`Handler for ${event} is not a function`);
    }
}

// Anti-Spam Event Handler
if (typeof handleSpamMessage === 'function') {
    client.on('messageCreate', handleSpamMessage);
} else {
    console.error('Anti-Spam handler is not a function');
}

// Anti-Link Event Handler
if (typeof handleLinkMessage === 'function') {
    client.on('messageCreate', handleLinkMessage);
} else {
    console.error('Anti-Link handler is not a function');
}

// Anti-Ghost Ping Event Handler
client.on('messageDelete', async (message) => {
    try {
        const messageDelete = require('./events/messageDelete');
        if (typeof messageDelete.execute === 'function') {
            await messageDelete.execute(message, client);
        } else {
            console.error('messageDelete handler is not a function');
        }
    } catch (error) {
        console.error('Error loading messageDelete handler:', error);
    }
});

client.on('messageCreate', async (message) => {
  if (message.channel.type === 'DM' && !message.author.bot) {
      try {
          const handleDirectMessage = require('./modules/handleDirectMessage');
          if (typeof handleDirectMessage === 'function') {
              await handleDirectMessage(message);
          } else {
              console.error('Direct message handler is not a function');
          }
      } catch (error) {
          console.error('Error loading direct message handler:', error);
      }
  }
});

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

client.login(config.token);
