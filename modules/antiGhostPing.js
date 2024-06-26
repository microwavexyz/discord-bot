const AntiGhostPing = require('../models/AntiGhostPing');

async function fetchSettings(guildId) {
    try {
        const settings = await AntiGhostPing.findOne({ guildId });
        return settings;
    } catch (error) {
        console.error(`Error fetching AntiGhostPing settings for guild ${guildId}:`, error);
        return null;
    }
}

async function handleMentions(message, mentions) {
    try {
        const memberFetchPromises = mentions.map(member => message.guild.members.fetch(member.id).catch(() => null));
        const fetchedMembers = await Promise.all(memberFetchPromises);

        fetchedMembers.forEach((member, index) => {
            if (!member) {
                message.delete();
                message.channel.send(`${message.author}, you tried to mention a non-existent member!`).catch(console.error);
            }
        });
    } catch (error) {
        console.error(`Error handling mentions in message ${message.id}:`, error);
    }
}

module.exports = {
    async handleMessage(message) {
        if (message.author.bot) return;

        const guildId = message.guild.id;
        const settings = await fetchSettings(guildId);

        if (!settings || !settings.enabled) return;

        const mentions = message.mentions.members;
        if (mentions.size === 0) return;

        await handleMentions(message, mentions);
    }
};
