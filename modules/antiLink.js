const AntiLinkSettings = require('../models/AntiLinkSettings');

async function fetchSettings(guildId) {
    try {
        const settings = await AntiLinkSettings.findOne({ guildId });
        return settings;
    } catch (error) {
        console.error(`Error fetching AntiLink settings for guild ${guildId}:`, error);
        return null;
    }
}

function containsLink(messageContent) {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    return linkRegex.test(messageContent);
}

function containsDiscordInvite(messageContent) {
    const discordInviteRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discordapp\.com\/invite)\/[^\s]+/g;
    return discordInviteRegex.test(messageContent);
}

module.exports = {
    async handleMessage(message) {
        if (message.author.bot) return;

        const guildId = message.guild.id;
        const settings = await fetchSettings(guildId);

        if (!settings || !settings.enabled) return;

        const memberRoles = message.member.roles.cache;
        const isExempt = settings.exemptRoles.some(roleId => memberRoles.has(roleId));
        if (isExempt) return;

        const messageContent = message.content;
        const hasLink = containsLink(messageContent);
        const hasDiscordInvite = containsDiscordInvite(messageContent);

        if (hasLink || (hasDiscordInvite && !settings.allowDiscordLinks)) {
            try {
                await message.delete();
                message.channel.send(`${message.author}, sharing links is not allowed!`);
            } catch (error) {
                console.error(`Error deleting message ${message.id}:`, error);
            }
        }
    }
};
