const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const config = require('./config.json');

// Anti-Nuke Handlers
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

// Anti-Spam Handler
const { handleMessage: handleSpamMessage } = require('./modules/antiSpam');

// Create a new client instance
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
    client.commands.set(command.data.name, command);
}

// Load events
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Anti-Nuke Event Handlers
client.on('channelDelete', handleChannelDelete);
client.on('roleDelete', handleRoleDelete);
client.on('guildMemberUpdate', handleGuildMemberUpdate);
client.on('channelCreate', handleChannelCreate);
client.on('roleCreate', handleRoleCreate);
client.on('messageCreate', handleMessageCreate);
client.on('roleUpdate', handleRoleUpdate);
client.on('guildMemberAdd', handleGuildMemberAdd);
client.on('channelUpdate', handleChannelUpdate);
client.on('webhookUpdate', handleWebhookCreate); // Combined webhook create and delete as webhookUpdate
client.on('webhookDelete', handleWebhookDelete);
client.on('webhookUpdate', handleWebhookMessage); // Combined webhook message spam as webhookUpdate

// Anti-Spam Event Handler
client.on('messageCreate', handleSpamMessage);

// Anti-Ghost Ping Event Handler
client.on('messageDelete', async (message) => {
    const messageDelete = require('./events/messageDelete');
    await messageDelete.execute(message, client);
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit the process with an error code
});
// Mass DM Event Handler
client.on('messageCreate', async (message) => {
  if (message.channel.type === 'DM' && !message.author.bot) {
      await handleDirectMessage(message);
  }
});
// Login to Discord with your app's token
client.login(config.token);
