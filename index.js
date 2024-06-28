const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const config = require('./config.json');

// Connect to MongoDB first
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load models
require('./models/AntiDiscord');
require('./models/AntiCaps');
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
    handleWebhookMessage,
    handleDirectMessage,
    restoreState,
} = require('./modules/antiNuke');

const { handleMessage: handleSpamMessage } = require('./modules/antiSpam');
const { handleMessage: handleLinkMessage } = require('./modules/antiLink');
const handleAntiSelfBot = require('./modules/antiSelfBot');
const handleAntiDiscord = require('./modules/antiDiscord');
const handleAntiCaps = require('./modules/antiCaps');
const { handleMessage: handleAntiGhostPing } = require('./modules/antiGhostPing');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
});

client.commands = new Collection();

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

const antiNukeHandlers = {
    channelDelete: handleChannelDelete,
    roleDelete: handleRoleDelete,
    guildMemberUpdate: handleGuildMemberUpdate,
    channelCreate: handleChannelCreate,
    roleCreate: handleRoleCreate,
    messageCreate: handleMessageCreate,
    roleUpdate: handleRoleUpdate,
    channelUpdate: handleChannelUpdate,
    webhookMessage: handleWebhookMessage,
};

for (const [event, handler] of Object.entries(antiNukeHandlers)) {
    if (typeof handler === 'function') {
        client.on(event, async (...args) => {
            console.log(`Anti-Nuke handler triggered for event: ${event}`);
            try {
                await handler(...args, client);
            } catch (error) {
                console.error(`Error handling ${event}:`, error);
            }
        });
    } else {
        console.error(`Handler for ${event} is not a function`);
    }
}

if (typeof handleSpamMessage === 'function') {
    client.on('messageCreate', handleSpamMessage);
} else {
    console.error('Anti-Spam handler is not a function');
}

if (typeof handleLinkMessage === 'function') {
    client.on('messageCreate', handleLinkMessage);
} else {
    console.error('Anti-Link handler is not a function');
}

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
            await handleDirectMessage(message);
        } catch (error) {
            console.error('Error handling direct message:', error);
        }
    }

    if (message.webhookId) {
        try {
            await handleWebhookMessage(message);
        } catch (error) {
            console.error('Error handling webhook message:', error);
        }
    }

    try {
        await handleAntiSelfBot(message);
    } catch (error) {
        console.error('Error handling anti-selfbot:', error);
    }

    try {
        await handleAntiDiscord(message);
    } catch (error) {
        console.error('Error handling anti-discord:', error.message);
        console.error(error.stack);
    }

    try {
        await handleAntiCaps(message);
    } catch (error) {
        console.error('Error handling anti-caps:', error);
    }

    try {
        await handleAntiGhostPing(message);
    } catch (error) {
        console.error('Error handling anti-ghost-ping:', error);
    }
});

client.login(config.token);