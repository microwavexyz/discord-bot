const { EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const ServerSettings = require('../models/ServerSettings');
const NukeLog = require('../models/NukeLog');
const { getNextProxy } = require('./proxyManager');
const NodeCache = require('node-cache');

const settingsCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
const auditLogCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });
const stateCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // Cache to store state before nukes

const AUDIT_LOG_TYPES = {
    CHANNEL_CREATE: 10,
    CHANNEL_UPDATE: 11,
    CHANNEL_DELETE: 12,
    ROLE_CREATE: 30,
    ROLE_UPDATE: 31,
    ROLE_DELETE: 32,
    MEMBER_UPDATE: 24,
    BOT_ADD: 28,
    WEBHOOK_CREATE: 40,
    WEBHOOK_DELETE: 42,
    MESSAGE_SEND: 23,
};

async function fetchWithProxy(url, options) {
    const proxy = getNextProxy();
    const proxyUrl = new URL(proxy);
    const proxyOptions = {
        ...options,
        agent: new ProxyAgent(proxyUrl.href),
    };

    return fetch(url, proxyOptions);
}

async function logNukeAction(userId, guildId, action) {
    const log = new NukeLog({ userId, guildId, action });
    await log.save();
}

async function notifyOwner(guild, member, reason) {
    try {
        const owner = await guild.fetchOwner();
        if (owner) {
            const embed = new EmbedBuilder()
                .setTitle(`User Banned for Excessive ${reason}`)
                .setDescription(`User ${member.user.tag} (${member.user.id}) was banned for ${reason}.`)
                .setColor('Red')
                .setTimestamp();

            await owner.send({ content: `<@${owner.id}>`, embeds: [embed] });
        } else {
            console.warn(`Could not fetch guild owner for guild: ${guild.id}`);
        }
    } catch (fetchError) {
        console.error(`Error fetching guild owner for guild: ${guild.id}`, fetchError);
    }
}

async function getBotMember(guild) {
    let botMember = guild.members.me;
    if (!botMember) {
        console.warn('guild.members.me is undefined, fetching bot member object directly.');
        try {
            botMember = await guild.members.fetch(guild.client.user.id);
        } catch (error) {
            console.error('Error fetching bot member object directly:', error);
        }
    }
    return botMember;
}

async function banMember(guild, userId, reason) {
    try {
        const member = await guild.members.fetch(userId);
        if (member) {
            const botMember = await getBotMember(guild);
            if (botMember && botMember.permissions.has('BAN_MEMBERS')) {
                console.log(`Banning user ${userId} in guild ${guild.id} for ${reason}`);
                await member.ban({ reason: `Anti-Nuke: ${reason}` });
                await notifyOwner(guild, member, reason);
                await restoreState(guild); // Restore state after banning nuker
            } else {
                console.error('Missing BAN_MEMBERS permission or botMember is undefined.');
            }
        } else {
            console.warn(`Could not fetch member with ID ${userId} in guild ${guild.id}`);
        }
    } catch (error) {
        console.error('Error in banMember:', error);
    }
}

async function handleExcessiveActions(settings, guild, userId, action, limit, reason) {
    try {
        const recentActions = await NukeLog.countDocuments({
            guildId: guild.id,
            userId,
            action,
            timestamp: { $gt: Date.now() - settings.timeFrame },
        });

        console.log(`Recent actions for user ${userId} in guild ${guild.id}: ${recentActions}`);
        console.log(`Limit for ${action}: ${limit}`);

        if (recentActions >= limit) {
            await banMember(guild, userId, `Excessive ${reason}`);
        }
    } catch (error) {
        console.error('Error in handleExcessiveActions:', error);
    }
}

async function fetchSettings(guildId) {
    let settings = settingsCache.get(guildId);
    if (!settings) {
        settings = await ServerSettings.findOne({ guildId });
        if (settings) {
            settingsCache.set(guildId, settings);
        }
    }
    return settings;
}

async function fetchAuditLogs(guild, type) {
    const cacheKey = `${guild.id}-${type}`;
    let auditLogs = auditLogCache.get(cacheKey);
    if (!auditLogs) {
        const fetchedLogs = await guild.fetchAuditLogs({ type, limit: 1 });
        auditLogs = fetchedLogs.entries;
        auditLogCache.set(cacheKey, auditLogs);
    }
    return auditLogs;
}

function getFirstAuditLogEntry(auditLogs) {
    if (auditLogs) {
        const entries = [...auditLogs.values()];
        return entries.length > 0 ? entries[0] : null;
    }
    return null;
}

async function saveStateBeforeNuke(guild, entity, stateType) {
    const guildId = guild.id;
    let guildState = stateCache.get(guildId) || {};

    if (!guildState[stateType]) {
        guildState[stateType] = [];
    }

    if (stateType === 'channels') {
        guildState[stateType].push({
            id: entity.id,
            name: entity.name,
            parentID: entity.parentId,
            position: entity.position,
            type: entity.type,
            topic: entity.topic,
        });
    } else if (stateType === 'roles') {
        guildState[stateType].push({
            id: entity.id,
            name: entity.name,
            color: entity.color,
            hoist: entity.hoist,
            position: entity.position,
            permissions: entity.permissions,
            managed: entity.managed,
            mentionable: entity.mentionable,
        });
    }

    stateCache.set(guildId, guildState);
}

async function restoreState(guild) {
    const guildId = guild.id;
    const guildState = stateCache.get(guildId);

    if (!guildState) return;

    const restorePromises = [];

    if (guildState.channels) {
        guildState.channels.forEach(async (channelData) => {
            const channel = guild.channels.cache.get(channelData.id);
            if (channel) {
                restorePromises.push(channel.delete(`Anti-Nuke: Restoring state`));
            } else {
                restorePromises.push(
                    guild.channels.create(channelData.name, {
                        type: channelData.type,
                        parent: channelData.parentID,
                        position: channelData.position,
                        topic: channelData.topic,
                    })
                );
            }
        });
    }

    if (guildState.roles) {
        guildState.roles.forEach(async (roleData) => {
            const role = guild.roles.cache.get(roleData.id);
            if (role) {
                restorePromises.push(role.delete(`Anti-Nuke: Restoring state`));
            } else {
                restorePromises.push(
                    guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        hoist: roleData.hoist,
                        position: roleData.position,
                        permissions: roleData.permissions,
                        managed: roleData.managed,
                        mentionable: roleData.mentionable,
                    })
                );
            }
        });
    }

    await Promise.all(restorePromises);
    stateCache.del(guildId); // Clear the cache after restoring state
}

async function handleChannelCreate(channel) {
    try {
        const settings = await fetchSettings(channel.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(channel.guild, AUDIT_LOG_TYPES.CHANNEL_CREATE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for CHANNEL_CREATE: ${JSON.stringify(entry)}`);
        if (!entry || !entry.executor) return;

        await logNukeAction(entry.executor.id, channel.guild.id, 'CHANNEL_CREATE');
        await saveStateBeforeNuke(channel.guild, channel, 'channels');

        if (channel.type === 'GUILD_CATEGORY') {
            await logNukeAction(entry.executor.id, channel.guild.id, 'CATEGORY_CREATE');
            await handleExcessiveActions(settings, channel.guild, entry.executor.id, 'CATEGORY_CREATE', settings.maxCategoriesCreated, 'category creations');
        } else {
            await handleExcessiveActions(settings, channel.guild, entry.executor.id, 'CHANNEL_CREATE', settings.maxChannelsCreated, 'channel creations');
        }
    } catch (error) {
        console.error('Error handling channel create:', error);
    }
}

async function handleChannelUpdate(oldChannel, newChannel) {
    try {
        const settings = await fetchSettings(newChannel.guild.id);
        if (!settings || !settings.enabled) return;

        if (oldChannel.name !== newChannel.name) {
            const auditLogs = await fetchAuditLogs(newChannel.guild, AUDIT_LOG_TYPES.CHANNEL_UPDATE);
            const entry = getFirstAuditLogEntry(auditLogs);
            console.log(`Audit Log Entry for CHANNEL_UPDATE: ${JSON.stringify(entry)}`);
            if (!entry || !entry.executor) return;

            await logNukeAction(entry.executor.id, newChannel.guild.id, 'CHANNEL_UPDATE');
            await saveStateBeforeNuke(newChannel.guild, newChannel, 'channels');
            await handleExcessiveActions(settings, newChannel.guild, entry.executor.id, 'CHANNEL_UPDATE', settings.maxChannelRenames, 'channel renames');

            if (newChannel.type === 'GUILD_CATEGORY') {
                await handleExcessiveActions(settings, newChannel.guild, entry.executor.id, 'CATEGORY_RENAME', settings.maxCategoryRenames, 'category renames');
            }
        }
    } catch (error) {
        console.error('Error handling channel update:', error);
    }
}

async function handleChannelDelete(channel) {
    try {
        const settings = await fetchSettings(channel.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(channel.guild, AUDIT_LOG_TYPES.CHANNEL_DELETE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for CHANNEL_DELETE: ${JSON.stringify(entry)}`);
        if (!entry || !entry.executor) return;

        await logNukeAction(entry.executor.id, channel.guild.id, 'CHANNEL_DELETE');
        await saveStateBeforeNuke(channel.guild, channel, 'channels');
        await handleExcessiveActions(settings, channel.guild, entry.executor.id, 'CHANNEL_DELETE', settings.maxChannelsDeleted, 'channel deletions');
    } catch (error) {
        console.error('Error handling channel delete:', error);
    }
}

async function handleRoleCreate(role) {
    try {
        const settings = await fetchSettings(role.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(role.guild, AUDIT_LOG_TYPES.ROLE_CREATE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for ROLE_CREATE: ${JSON.stringify(entry)}`);
        if (!entry || !entry.executor) return;

        await logNukeAction(entry.executor.id, role.guild.id, 'ROLE_CREATE');
        await saveStateBeforeNuke(role.guild, role, 'roles');
        await handleExcessiveActions(settings, role.guild, entry.executor.id, 'ROLE_CREATE', settings.maxRolesCreated, 'role creations');
    } catch (error) {
        console.error('Error handling role create:', error);
    }
}

async function handleRoleUpdate(oldRole, newRole) {
    try {
        const settings = await fetchSettings(newRole.guild.id);
        if (!settings || !settings.enabled) return;

        if (oldRole.name !== newRole.name) {
            const auditLogs = await fetchAuditLogs(newRole.guild, AUDIT_LOG_TYPES.ROLE_UPDATE);
            const entry = getFirstAuditLogEntry(auditLogs);
            console.log(`Audit Log Entry for ROLE_UPDATE: ${JSON.stringify(entry)}`);
            if (!entry || !entry.executor) return;

            await logNukeAction(entry.executor.id, newRole.guild.id, 'ROLE_UPDATE');
            await saveStateBeforeNuke(newRole.guild, newRole, 'roles');
            await handleExcessiveActions(settings, newRole.guild, entry.executor.id, 'ROLE_UPDATE', settings.maxRoleRenames, 'role renames');
        }
    } catch (error) {
        console.error('Error handling role update:', error);
    }
}

async function handleRoleDelete(role) {
    try {
        const settings = await fetchSettings(role.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(role.guild, AUDIT_LOG_TYPES.ROLE_DELETE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for ROLE_DELETE: ${JSON.stringify(entry)}`);
        if (!entry || !entry.executor) return;

        await logNukeAction(entry.executor.id, role.guild.id, 'ROLE_DELETE');
        await saveStateBeforeNuke(role.guild, role, 'roles');
        await handleExcessiveActions(settings, role.guild, entry.executor.id, 'ROLE_DELETE', settings.maxRolesDeleted, 'role deletions');
    } catch (error) {
        console.error('Error handling role delete:', error);
    }
}

async function handleGuildMemberUpdate(oldMember, newMember) {
    try {
        const settings = await fetchSettings(newMember.guild.id);
        if (!settings || !settings.enabled) return;

        if (oldMember.nickname !== newMember.nickname) {
            const auditLogs = await fetchAuditLogs(newMember.guild, AUDIT_LOG_TYPES.MEMBER_UPDATE);
            const entry = getFirstAuditLogEntry(auditLogs);
            console.log(`Audit Log Entry for MEMBER_UPDATE: ${JSON.stringify(entry)}`);
            if (!entry || !entry.executor) return;

            await logNukeAction(entry.executor.id, newMember.guild.id, 'NICKNAME_UPDATE');
            await handleExcessiveActions(settings, newMember.guild, entry.executor.id, 'NICKNAME_UPDATE', settings.maxNicknamesChanged, 'nickname changes');
        }
    } catch (error) {
        console.error('Error handling guild member update:', error);
    }
}

async function handleGuildMemberAdd(member) {
    try {
        const settings = await fetchSettings(member.guild.id);
        if (!settings || !settings.enabled) return;

        if (member.user.bot) {
            const auditLogs = await fetchAuditLogs(member.guild, AUDIT_LOG_TYPES.BOT_ADD);
            const entry = getFirstAuditLogEntry(auditLogs);
            console.log(`Audit Log Entry for BOT_ADD: ${JSON.stringify(entry)}`);
            if (!entry || !entry.executor) return;

            await logNukeAction(entry.executor.id, member.guild.id, 'BOT_ADD');
            await handleExcessiveActions(settings, member.guild, entry.executor.id, 'BOT_ADD', settings.maxBotsAdded, 'bot additions');
        } else {
            await logNukeAction(member.id, member.guild.id, 'USER_JOIN');
            await handleExcessiveActions(settings, member.guild, member.id, 'USER_JOIN', settings.maxUsersAdded, 'user additions');
        }
    } catch (error) {
        console.error('Error handling guild member add:', error);
    }
}

async function handleMessageCreate(message) {
    try {
        const settings = await fetchSettings(message.guild.id);
        if (!settings || !settings.enabled) return;

        const mentions = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
        if (mentions >= settings.maxMentions) {
            await banMember(message.guild, message.author.id, 'Excessive mentions');
        }
    } catch (error) {
        console.error('Error handling message create:', error);
    }
}

async function handleWebhookCreate(webhook) {
    try {
        const settings = await fetchSettings(webhook.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(webhook.guild, AUDIT_LOG_TYPES.WEBHOOK_CREATE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for WEBHOOK_CREATE: ${JSON.stringify(entry)}`);
        if (!entry || !entry.executor) return;

        await logNukeAction(entry.executor.id, webhook.guild.id, 'WEBHOOK_CREATE');
        await saveStateBeforeNuke(webhook.guild, webhook, 'webhooks');
        await handleExcessiveActions(settings, webhook.guild, entry.executor.id, 'WEBHOOK_CREATE', settings.maxWebhooksCreated, 'webhook creations');
    } catch (error) {
        console.error('Error handling webhook create:', error);
    }
}

async function handleWebhookDelete(webhook) {
    try {
        const settings = await fetchSettings(webhook.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(webhook.guild, AUDIT_LOG_TYPES.WEBHOOK_DELETE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for WEBHOOK_DELETE: ${JSON.stringify(entry)}`);
        if (!entry || !entry.executor) return;

        await logNukeAction(entry.executor.id, webhook.guild.id, 'WEBHOOK_DELETE');
        await saveStateBeforeNuke(webhook.guild, webhook, 'webhooks');
        await handleExcessiveActions(settings, webhook.guild, entry.executor.id, 'WEBHOOK_DELETE', settings.maxWebhooksDeleted, 'webhook deletions');
    } catch (error) {
        console.error('Error handling webhook delete:', error);
    }
}

const webhookMessageCounts = new Map();

async function handleWebhookMessage(message) {
    try {
        const settings = await fetchSettings(message.guild.id);
        if (!settings || !settings.enabled) return;

        if (message.webhookId) {
            const webhookId = message.webhookId;
            const now = Date.now();
            if (!webhookMessageCounts.has(webhookId)) {
                webhookMessageCounts.set(webhookId, []);
            }

            const timestamps = webhookMessageCounts.get(webhookId);
            timestamps.push(now);

            const recentMessages = timestamps.filter(timestamp => now - timestamp < settings.timeFrame);
            webhookMessageCounts.set(webhookId, recentMessages);

            if (recentMessages.length >= settings.maxWebhookMessages) {
                const auditLogs = await fetchAuditLogs(message.guild, AUDIT_LOG_TYPES.MESSAGE_SEND);
                const entry = getFirstAuditLogEntry(auditLogs);
                console.log(`Audit Log Entry for WEBHOOK_MESSAGE: ${JSON.stringify(entry)}`);
                if (entry && entry.target.id === webhookId) {
                    await logNukeAction(entry.executor.id, message.guild.id, 'WEBHOOK_MESSAGE_SPAM');
                    await handleExcessiveActions(settings, message.guild, entry.executor.id, 'WEBHOOK_MESSAGE_SPAM', settings.maxWebhookMessages, 'webhook message spam');
                }
            }
        }
    } catch (error) {
        console.error('Error handling webhook message:', error);
    }
}

const dmMessageCounts = new Map();

async function handleDirectMessage(message) {
    try {
        const userId = message.author.id;
        const now = Date.now();

        if (!dmMessageCounts.has(userId)) {
            dmMessageCounts.set(userId, []);
        }

        const timestamps = dmMessageCounts.get(userId);
        timestamps.push(now);

        const recentMessages = timestamps.filter(timestamp => now - timestamp < 60000);
        dmMessageCounts.set(userId, recentMessages);

        if (recentMessages.length >= 10) {
            await banMember(message.guild, userId, 'Excessive DMs');
        }
    } catch (error) {
        console.error('Error handling direct message:', error);
    }
}

module.exports = {
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
    handleWebhookMessage,
    handleDirectMessage,
};
