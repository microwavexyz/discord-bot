const { AntiSelfBot } = require('../models/AntiSelfBot');
const { updateUserStrikes } = require('./userStrikes');

const recentMessages = new Map();

async function checkUnusualBehavior(message) {
  const { author, guild, createdTimestamp, content } = message;
  const userId = author.id;
  const guildId = guild.id;

  // Get or initialize user's recent messages
  const userMessages = recentMessages.get(userId) || [];
  userMessages.push({ content, timestamp: createdTimestamp });

  // Keep only the last 10 messages
  if (userMessages.length > 10) userMessages.shift();
  recentMessages.set(userId, userMessages);

  // Check for rapid message sending
  if (userMessages.length === 10) {
    const timeSpan = userMessages[9].timestamp - userMessages[0].timestamp;
    if (timeSpan < 5000) { // Less than 5 seconds for 10 messages
      await takeAction(message, 'Rapid message sending detected');
      return;
    }
  }

  // Check for identical messages across channels
  const identicalMessages = userMessages.filter(msg => msg.content === content);
  if (identicalMessages.length >= 3) {
    await takeAction(message, 'Multiple identical messages detected');
    return;
  }

  // Check for unusually formatted messages (e.g., JSON-like structure)
  if (content.startsWith('{') && content.endsWith('}')) {
    await takeAction(message, 'Unusually formatted message detected');
    return;
  }

  // Check for messages sent at exact intervals
  if (userMessages.length >= 3) {
    const intervals = [];
    for (let i = 1; i < userMessages.length; i++) {
      intervals.push(userMessages[i].timestamp - userMessages[i-1].timestamp);
    }
    const allEqual = intervals.every(interval => interval === intervals[0]);
    if (allEqual) {
      await takeAction(message, 'Messages sent at exact intervals detected');
      return;
    }
  }
}

async function takeAction(message, reason) {
  const settings = await AntiSelfBot.findOne({ guildId: message.guild.id });

  if (settings && settings.enabled) {
    await message.delete().catch(console.error);
    await message.channel.send(`${message.author}, unusual behavior detected. This may be considered as self-botting.`).catch(console.error);

    if (settings.logChannelId) {
      const logChannel = await message.guild.channels.fetch(settings.logChannelId);
      await logChannel.send(`Unusual behavior detected from ${message.author.tag} in ${message.channel}: ${reason}`).catch(console.error);
    }

    await updateUserStrikes(message.author.id, message.guild.id);
  }
}

module.exports = { checkUnusualBehavior };