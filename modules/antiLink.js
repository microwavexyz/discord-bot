const AntiLinkSettings = require('../models/AntiLinkSettings');

async function fetchSettings(guildId) {
    try {
        return await AntiLinkSettings.findOne({ guildId });
    } catch (error) {
        console.error(`Error fetching AntiLink settings for guild ${guildId}:`, error);
        return null;
    }
}

function containsProhibitedLink(messageContent, allowDiscordLinks) {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const discordInviteRegex = /(https?:\/\/)?(www\.)?(discord\.gg|discordapp\.com\/invite)\/[^\s]+/g;

    if (linkRegex.test(messageContent)) {
        if (!allowDiscordLinks && discordInviteRegex.test(messageContent)) {
            return true;
        }
        return !discordInviteRegex.test(messageContent);
    }
    return false;
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
        const hasProhibitedLink = containsProhibitedLink(messageContent, settings.allowDiscordLinks);

        if (hasProhibitedLink) {
            try {
                await message.delete();
                await message.channel.send(`${message.author}, sharing links is not allowed!`).catch(console.error);
            } catch (error) {
                console.error(`Error deleting message ${message.id}:`, error);
            }
        }
    }
};
