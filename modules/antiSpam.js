const AntiSpam = require('../models/AntiSpam');
const AntiSpamSettings = require('../models/AntiSpamSettings');
const messageCache = new Map();

async function deleteMessages(messages) {
    for (const message of messages.values()) {
        try {
            if (message && message.deletable) {
                await message.delete();
            } else {
                console.warn('Message is not deletable or already deleted');
            }
        } catch (error) {
            if (error.code === 10008) {
                console.warn('Failed to delete message: Unknown Message');
            } else {
                console.error('Failed to delete message:', error);
            }
        }
    }
}

module.exports = {
    async handleMessage(message) {
        if (message.author.bot) return;

        const guildId = message.guild.id;
        const userId = message.author.id;

        const settings = await AntiSpamSettings.findOne({ guildId });
        if (!settings) {
            console.log('AntiSpam settings not found for guild:', guildId);
            return;
        }

        const now = Date.now();
        const userMessages = messageCache.get(userId) || [];
        const recentMessages = userMessages.filter(timestamp => now - timestamp < settings.timeFrame);
        recentMessages.push(now);
        messageCache.set(userId, recentMessages);

        console.log(`User ${message.author.tag} has ${recentMessages.length} messages in the last ${settings.timeFrame}ms`);

        if (recentMessages.length > settings.threshold) {
            const member = await message.guild.members.fetch(userId);

            let userOffenses = await AntiSpam.findOne({ guildId, userId });
            if (!userOffenses) {
                userOffenses = new AntiSpam({
                    guildId,
                    userId,
                    offenses: 0,
                    lastOffense: now
                });
            }

            const offenseWindow = 3 * 24 * 60 * 60 * 1000; 
            if (now - userOffenses.lastOffense < offenseWindow) {
                userOffenses.offenses += 1;
            } else {
                userOffenses.offenses = 1;
            }
            userOffenses.lastOffense = now;
            await userOffenses.save();

            const punishmentDuration = Math.min(5 * userOffenses.offenses, 1440); 

           
            const messages = await message.channel.messages.fetch({ limit: 100 });
            const userMessagesToDelete = messages.filter(msg => msg.author.id === userId);
            await deleteMessages(userMessagesToDelete);

            
            const currentTimeout = member.communicationDisabledUntilTimestamp;
            const isAlreadyMuted = currentTimeout && currentTimeout > Date.now();

            if (!isAlreadyMuted) {
                await member.timeout(punishmentDuration * 60 * 1000, 'Spamming'); 
                message.channel.send(`${message.author}, you have been muted for spamming! Duration: ${punishmentDuration} minutes`);
            }

            messageCache.set(userId, []);
        }
    }
};
