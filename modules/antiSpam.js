const AntiSpam = require('../models/AntiSpam');
const AntiSpamSettings = require('../models/AntiSpamSettings');
const messageCache = new Map();

async function deleteMessages(messages) {
    for (const message of messages.values()) {
        try {
            if (message && message.deletable) {
                await message.delete();
            } else {
                console.warn(`Message ${message.id} is not deletable or already deleted`);
            }
        } catch (error) {
            if (error.code === 10008) {
                console.warn(`Failed to delete message ${message.id}: Unknown Message`);
            } else {
                console.error(`Failed to delete message ${message.id}:`, error);
            }
        }
    }
}

async function getUserOffenses(guildId, userId, now) {
    let userOffenses = await AntiSpam.findOne({ guildId, userId });
    if (!userOffenses) {
        userOffenses = new AntiSpam({
            guildId,
            userId,
            offenses: 0,
            lastOffense: now,
        });
    }

    const offenseWindow = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    if (now - userOffenses.lastOffense < offenseWindow) {
        userOffenses.offenses += 1;
    } else {
        userOffenses.offenses = 1;
    }
    userOffenses.lastOffense = now;
    await userOffenses.save();

    return userOffenses.offenses;
}

function containsExcessiveSpecialChars(messageContent) {
    const specialCharRegex = /[^a-zA-Z0-9\s]/g;
    const specialChars = messageContent.match(specialCharRegex) || [];
    return specialChars.length > 10; // Define the threshold for special characters
}

function containsExcessiveEmojis(messageContent) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    const emojis = messageContent.match(emojiRegex) || [];
    return emojis.length > 10; // Define the threshold for emojis
}

async function handleSpam(message, settings) {
    const { guild, author } = message;
    const guildId = guild.id;
    const userId = author.id;

    const now = Date.now();
    const userMessages = messageCache.get(userId) || [];
    const recentMessages = userMessages.filter(timestamp => now - timestamp < settings.timeFrame);
    recentMessages.push(now);
    messageCache.set(userId, recentMessages);

    console.log(`User ${author.tag} has ${recentMessages.length} messages in the last ${settings.timeFrame}ms`);

    const isSpammingMessages = recentMessages.length > settings.threshold;
    const isSpammingSpecialChars = containsExcessiveSpecialChars(message.content);
    const isSpammingEmojis = containsExcessiveEmojis(message.content);

    if (isSpammingMessages || isSpammingSpecialChars || isSpammingEmojis) {
        const member = await guild.members.fetch(userId);

        const offenses = await getUserOffenses(guildId, userId, now);
        const punishmentDuration = Math.min(5 * offenses, 1440); // Max 1440 minutes (24 hours)

        // Delete user's recent messages
        const messages = await message.channel.messages.fetch({ limit: 100 });
        const userMessagesToDelete = messages.filter(msg => msg.author.id === userId);
        await deleteMessages(userMessagesToDelete);

        // Check if the user is already muted
        const currentTimeout = member.communicationDisabledUntilTimestamp;
        const isAlreadyMuted = currentTimeout && currentTimeout > now;

        if (!isAlreadyMuted) {
            await member.timeout(punishmentDuration * 60 * 1000, 'Spamming'); // Timeout in milliseconds
            message.channel.send(`${author}, you have been muted for spamming! Duration: ${punishmentDuration} minutes`);
        }

        // Reset the user's message cache
        messageCache.set(userId, []);
    }
}

module.exports = {
    async handleMessage(message) {
        if (message.author.bot) return;

        const guildId = message.guild.id;

        try {
            const settings = await AntiSpamSettings.findOne({ guildId });
            if (!settings) {
                console.log(`AntiSpam settings not found for guild: ${guildId}`);
                return;
            }

            await handleSpam(message, settings);
        } catch (error) {
            console.error(`Error handling message for AntiSpam:`, error);
        }
    },
};
