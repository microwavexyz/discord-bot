const AntiSpam = require('../models/AntiSpam');
const AntiSpamSettings = require('../models/AntiSpamSettings');
const messageCache = new Map();

async function deleteMessages(messages) {
    const deletableMsgs = messages.filter(msg => msg.deletable);
    try {
        await Promise.all(deletableMsgs.map(async msg => {
            try {
                await msg.delete();
            } catch (error) {
                if (error.code === 10008) {
                    console.warn(`Message ${msg.id} was already deleted or cannot be found.`);
                } else {
                    console.error(`Failed to delete message ${msg.id}:`, error);
                }
            }
        }));
    } catch (error) {
        console.error('Failed to delete messages:', error);
    }
}

async function getUserOffenses(guildId, userId, now) {
    const offenseWindow = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    let userOffenses = await AntiSpam.findOne({ guildId, userId });
    if (!userOffenses) {
        userOffenses = new AntiSpam({
            guildId,
            userId,
            offenses: 1,
            lastOffense: now,
        });
    } else {
        userOffenses.offenses = now - userOffenses.lastOffense < offenseWindow ? userOffenses.offenses + 1 : 1;
        userOffenses.lastOffense = now;
    }
    await AntiSpam.findOneAndUpdate(
        { guildId, userId },
        { $set: userOffenses },
        { upsert: true, new: true }
    );
    return userOffenses.offenses;
}

function containsExcessiveSpecialChars(messageContent) {
    const specialCharRegex = /[^a-zA-Z0-9\s]/g;
    const specialChars = messageContent.match(specialCharRegex) || [];
    return specialChars.length > 10;
}

function containsExcessiveEmojis(messageContent) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    const emojis = messageContent.match(emojiRegex) || [];
    return emojis.length > 10;
}

function isSpammingContent(message, settings) {
    const messageContent = message.content;
    return (
        messageCache.get(message.author.id).length > settings.threshold ||
        containsExcessiveSpecialChars(messageContent) ||
        containsExcessiveEmojis(messageContent)
    );
}
async function handleSpam(message, settings) {
    const { guild, author } = message;
    if (!guild || !author) return;
    const guildId = guild.id;
    const userId = author.id;
    const now = Date.now();

    const userMessages = messageCache.get(userId) || [];
    const recentMessages = userMessages.filter(timestamp => now - timestamp < settings.timeFrame);
    recentMessages.push(now);
    messageCache.set(userId, recentMessages);

    if (isSpammingContent(message, settings)) {
        const member = await guild.members.fetch(userId);
        if (!member.manageable || !guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) return;

        const offenses = await getUserOffenses(guildId, userId, now);
        const punishmentDuration = Math.min(5 * offenses, 1440); // Max 1440 minutes (24 hours)

        const messages = await message.channel.messages.fetch({ limit: 100 });
        const userMessagesToDelete = messages.filter(msg => msg.author.id === userId && now - msg.createdTimestamp < settings.timeFrame);
        await deleteMessages(userMessagesToDelete);

        const currentTimeout = member.communicationDisabledUntilTimestamp;
        const isAlreadyMuted = currentTimeout && currentTimeout > now;
        if (!isAlreadyMuted) {
            try {
                await member.timeout(punishmentDuration * 60 * 1000, 'Spamming');
                await message.channel.send(`${author}, you have been muted for spamming! Duration: ${punishmentDuration} minutes`).catch(console.error);
            } catch (error) {
                console.error('Error timing out member:', error);
            }
        }
        messageCache.set(userId, []);
    }
}

module.exports = {
    async handleMessage(message) {
        if (!message.guild) return;
        const guildId = message.guild.id;
        try {
            const settings = await AntiSpamSettings.findOne({ guildId });
            if (!settings) return;
            await handleSpam(message, settings);
        } catch (error) {
            console.error('Error handling message for AntiSpam:', error);
        }
    },
};
