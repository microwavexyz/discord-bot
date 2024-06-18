const { MessageEmbed, PermissionFlagsBits, ChannelType } = require('discord.js');
const ServerSettings = require('../models/ServerSettings');
const NukeLog = require('../models/NukeLog');
const Whitelist = require('../models/Whitelist');

const settingsCache = new Map();
const auditLogCache = new Map();
const stateCache = new Map();

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

async function addWhitelist(guildId, { userId, webhookId }) {
    if (!guildId || (!userId && !webhookId)) {
        throw new Error('guildId and either userId or webhookId are required.');
    }

    const query = { guildId };
    if (userId) query.userId = userId;
    if (webhookId) query.webhookId = webhookId;

    const existing = await Whitelist.findOne(query);
    if (existing) {
        throw new Error('This user or webhook is already whitelisted.');
    }

    const whitelist = new Whitelist(query);
    await whitelist.save();
    console.log(`Added ${userId ? 'user' : 'webhook'} to whitelist in guild ${guildId}`);
}

async function removeWhitelist(guildId, { userId, webhookId }) {
    if (!guildId || (!userId && !webhookId)) {
        throw new Error('guildId and either userId or webhookId are required.');
    }

    const query = { guildId };
    if (userId) query.userId = userId;
    if (webhookId) query.webhookId = webhookId;

    const result = await Whitelist.deleteOne(query);
    if (result.deletedCount === 0) {
        throw new Error('This user or webhook is not in the whitelist.');
    }

    console.log(`Removed ${userId ? 'user' : 'webhook'} from whitelist in guild ${guildId}`);
}

async function isWhitelisted(guildId, { userId, webhookId }) {
    if (!guildId || (!userId && !webhookId)) {
        throw new Error('guildId and either userId or webhookId are required.');
    }

    const query = { guildId };
    if (userId) query.userId = userId;
    if (webhookId) query.webhookId = webhookId;

    const existing = await Whitelist.findOne(query);
    return !!existing;
}

async function logNukeAction(userId, guildId, action) {
    console.log(`Logging nuke action: ${action} by user ${userId} in guild ${guildId}`);
    const log = new NukeLog({ userId, guildId, action });
    await log.save();
}

async function notifyOwner(guild, member, reason) {
    try {
        const owner = await guild.fetchOwner();
        const embed = new MessageEmbed()
            .setTitle(`User Banned for Excessive ${reason}`)
            .setDescription(`User ${member.user.tag} (${member.user.id}) was banned for ${reason}.`)
            .setColor('Red')
            .setTimestamp();

        console.log(`Notifying guild owner ${owner.user.tag} (${owner.id}) about ban of user ${member.user.tag} (${member.user.id})`);

        try {
            await owner.send({ content: `<@${owner.id}>`, embeds: [embed] });
        } catch (sendError) {
            console.error(`Error sending notification to guild owner ${owner.user.tag} (${owner.id}) in guild ${guild.id}:`, sendError);
        }
    } catch (fetchError) {
        console.error(`Error fetching guild owner for guild ${guild.id}:`, fetchError);
    }
}

async function getBotMember(guild) {
    try {
        let botMember = guild.members.me;
        if (!botMember) {
            console.warn(`guild.members.me is undefined in guild ${guild.id}, fetching bot member object directly.`);
            botMember = await guild.members.fetch(guild.client.user.id);
        }
        return botMember;
    } catch (error) {
        console.error(`Error fetching bot member in guild ${guild.id}:`, error);
        return null;
    }
}

async function banMember(guild, userId, reason) {
    try {
        const botMember = guild.members.me;
        if (!botMember.permissions.has('BAN_MEMBERS')) {
            console.error(`Missing BAN_MEMBERS permission for the bot in guild ${guild.id}.`);
            return;
        }

        if (userId === guild.ownerId) {
            console.error(`Cannot ban the guild owner (${userId}) in guild ${guild.id}.`);
            return;
        }

        if (userId === botMember.id) {
            console.error('Cannot ban the bot itself.');
            return;
        }

        const memberToBan = await guild.members.fetch(userId).catch(() => null);
        if (!memberToBan) {
            console.error(`Member ${userId} not found in guild ${guild.id}.`);
            return;
        }

        if (memberToBan.roles.highest.position >= botMember.roles.highest.position) {
            console.error(`Cannot ban member ${memberToBan.user.tag} (${memberToBan.id}) with higher or equal role position in guild ${guild.id}.`);
            return;
        }

        console.log(`Banning user ${userId} in guild ${guild.id} for ${reason}.`);
        await guild.members.ban(userId, { reason: `Anti-Nuke: ${reason}` });
        await notifyOwner(guild, { user: { tag: memberToBan.user.tag, id: userId } }, reason);
        await restoreState(guild);
    } catch (error) {
        console.error(`Error in banMember for guild ${guild.id}:`, error);
    }
}

async function handleExcessiveActions(settings, guild, userId, action, limit, reason) {
    try {
        const timeFrame = settings.timeFrame || 60 * 60 * 1000; // Default to 1 hour if not provided
        const recentActions = await NukeLog.countDocuments({
            guildId: guild.id,
            userId,
            action,
            timestamp: { $gt: Date.now() - timeFrame },
        });

        console.log(`Recent ${action}s for user ${userId} in guild ${guild.id}: ${recentActions}`);
        console.log(`Limit for ${action}: ${limit}`);

        if (recentActions >= limit) {
            console.log(`User ${userId} exceeded limit for ${action}. Banning for excessive ${reason}.`);
            await banMember(guild, userId, `Excessive ${reason}`);

            // Log the ban action
            await NukeLog.create({
                guildId: guild.id,
                userId,
                action: 'ban',
                reason: `Excessive ${reason}`,
                timestamp: Date.now(),
            });

            return true;
        }

        return false;
    } catch (error) {
        console.error(`Error in handleExcessiveActions for guild ${guild.id}:`, error);
        return false;
    }
}
async function fetchSettings(guildId) {
    let settings = settingsCache.get(guildId);
    if (!settings) {
        console.log(`Fetching settings for guild ${guildId}`);
        settings = await ServerSettings.findOne({ guildId });
        if (settings) {
            console.log(`Caching settings for guild ${guildId}`);
            settingsCache.set(guildId, settings);
        }
    }
    return settings;
}

async function fetchAuditLogs(guild, type) {
    const cacheKey = `${guild.id}-${type}`;
    const cachedLogs = auditLogCache.get(cacheKey);

    if (cachedLogs !== undefined) {
        return cachedLogs;
    }

    console.log(`Fetching audit logs of type ${type} for guild ${guild.id}`);
    try {
        const fetchedLogs = await guild.fetchAuditLogs({ type, limit: 1 });
        const auditLogs = fetchedLogs.entries.first();
        auditLogCache.set(cacheKey, auditLogs || null);
        return auditLogs;
    } catch (error) {
        console.error(`Error fetching audit logs for guild ${guild.id}:`, error);
        return null;
    }
}

function getFirstAuditLogEntry(auditLogs) {
    return auditLogs || null;
}

async function saveStateBeforeNuke(guild, entity, stateType) {
    const guildId = guild.id;
    const guildState = stateCache.get(guildId) || {};
    if (!guildState[stateType]) {
        guildState[stateType] = [];
    }
    const stateData = {
        id: entity.id,
        name: entity.name,
        position: entity.position,
    };
    if (stateType === 'channels') {
        console.log(`Saving state of channel ${entity.id} (${entity.name}) in guild ${guildId}`);
        const permissionOverwrites = entity.permissionOverwrites ? [...entity.permissionOverwrites.cache.values()] : [];
        Object.assign(stateData, {
            parentID: entity.parentId,
            type: entity.type,
            topic: entity.topic,
            permissionOverwrites: permissionOverwrites.map(overwrite => ({
                id: overwrite.id,
                type: overwrite.type,
                deny: overwrite.deny.bitfield,
                allow: overwrite.allow.bitfield,
            })),
        });
    } else if (stateType === 'roles') {
        console.log(`Saving state of role ${entity.id} (${entity.name}) in guild ${guildId}`);
        Object.assign(stateData, {
            color: entity.color,
            hoist: entity.hoist,
            permissions: entity.permissions.bitfield,
            mentionable: entity.mentionable,
        });
    } else {
        console.warn(`Unknown state type: ${stateType}`);
        return;
    }
    guildState[stateType].push(stateData);
    stateCache.set(guildId, guildState);
}

async function restoreState(guild) {
    const guildId = guild.id;
    const guildState = stateCache.get(guildId);
    if (!guildState) return;

    const restorePromises = [];

    if (guildState.channels) {
        for (const channelData of guildState.channels) {
            const channel = guild.channels.cache.get(channelData.id);
            if (channel) {
                console.log(`Deleting channel ${channelData.id} (${channelData.name}) to restore state in guild ${guildId}`);
                restorePromises.push(channel.delete({ reason: 'Anti-Nuke: Restoring state' }));
            } else {
                console.log(`Creating channel ${channelData.name} to restore state in guild ${guildId}`);
                restorePromises.push(
                    guild.channels.create({
                        name: channelData.name,
                        type: channelData.type,
                        parent: channelData.parentID,
                        position: channelData.position,
                        topic: channelData.topic,
                        permissionOverwrites: channelData.permissionOverwrites,
                    })
                );
            }
        }
    }

    if (guildState.roles) {
        for (const roleData of guildState.roles) {
            const role = guild.roles.cache.get(roleData.id);
            if (role) {
                console.log(`Deleting role ${roleData.id} (${roleData.name}) to restore state in guild ${guildId}`);
                restorePromises.push(role.delete({ reason: 'Anti-Nuke: Restoring state' }));
            } else {
                console.log(`Creating role ${roleData.name} to restore state in guild ${guildId}`);
                restorePromises.push(
                    guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        hoist: roleData.hoist,
                        position: roleData.position,
                        permissions: roleData.permissions,
                        mentionable: roleData.mentionable,
                    })
                );
            }
        }
    }

    try {
        await Promise.all(restorePromises);
        console.log(`Successfully restored state for guild ${guildId}`);
    } catch (error) {
        console.error(`Error restoring state for guild ${guildId}:`, error);
    } finally {
        console.log(`Clearing state cache for guild ${guildId}`);
        stateCache.delete(guildId);
    }
}

async function handleChannelCreate(channel) {
    try {
        console.log(`Handling channel create: ${channel.id} (${channel.name}) in guild ${channel.guild.id}`);
        const settings = await fetchSettings(channel.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(channel.guild, AUDIT_LOG_TYPES.CHANNEL_CREATE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for CHANNEL_CREATE: ${JSON.stringify(entry)}`);
        if (!entry || !entry.executor) return;

        await logNukeAction(entry.executor.id, channel.guild.id, 'CHANNEL_CREATE');
        await saveStateBeforeNuke(channel.guild, channel, 'channels');

        if (channel.type === ChannelType.GuildCategory) {
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
        console.log(`Handling channel update: ${oldChannel.id} (${oldChannel.name}) to ${newChannel.name} in guild ${newChannel.guild.id}`);
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

            if (newChannel.type === ChannelType.GuildCategory) {
                await handleExcessiveActions(settings, newChannel.guild, entry.executor.id, 'CATEGORY_RENAME', settings.maxCategoryRenames, 'category renames');
            }
        }
    } catch (error) {
        console.error('Error handling channel update:', error);
    }
}

async function handleChannelDelete(channel) {
    try {
        console.log(`Handling channel delete: ${channel.id} (${channel.name}) in guild ${channel.guild.id}`);
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
        console.log(`Handling role create: ${role.id} (${role.name}) in guild ${role.guild.id}`);
        const settings = await fetchSettings(role.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(role.guild, AUDIT_LOG_TYPES.ROLE_CREATE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for ROLE_CREATE: ${entry ? JSON.stringify(entry) : 'No entry found'}`);
        if (!entry || !entry.executor) return;

        const executor = await role.guild.members.fetch(entry.executor.id).catch(() => null);
        if (!executor) {
            console.log(`Failed to fetch executor: ${entry.executor.tag} (${entry.executor.id})`);
            return;
        }

        const botMember = await getBotMember(role.guild);
        if (executor.id === botMember.id || executor.roles.highest.position >= botMember.roles.highest.position) {
            console.log(`Ignoring role creation by bot or user with higher role position: ${executor.user.tag} (${executor.id})`);
            return;
        }

        if (settings.whitelistedUsers && settings.whitelistedUsers.includes(executor.id)) {
            console.log(`Ignoring role creation by whitelisted user: ${executor.user.tag} (${executor.id})`);
            return;
        }

        if (!botMember.permissions.has('VIEW_AUDIT_LOG') || !botMember.permissions.has('MANAGE_ROLES') || !botMember.permissions.has('BAN_MEMBERS')) {
            console.log(`Bot lacks permissions to handle role creation in guild ${role.guild.id}`);
            return;
        }

        await logNukeAction(executor.id, role.guild.id, 'ROLE_CREATE');
        await saveStateBeforeNuke(role.guild, role, 'roles');

        const recentActions = await handleExcessiveActions(settings, role.guild, executor.id, 'ROLE_CREATE', settings.maxRolesCreated, 'role creations');
        if (recentActions) {
            console.log(`Banning user ${executor.id} for excessive role creations`);
            await banMember(role.guild, executor.id, 'Excessive role creations');
        }
    } catch (error) {
        console.error('Error handling role create:', error);
    }
}
async function handleRoleUpdate(oldRole, newRole) {
    try {
        console.log(`Handling role update: ${oldRole.id} (${oldRole.name}) to ${newRole.name} in guild ${newRole.guild.id}`);
        const settings = await fetchSettings(newRole.guild.id);
        if (!settings || !settings.enabled) return;

        // Check if the role update is significant
        if (
            oldRole.name !== newRole.name ||
            oldRole.color !== newRole.color ||
            oldRole.hoist !== newRole.hoist ||
            oldRole.permissions.bitfield !== newRole.permissions.bitfield ||
            oldRole.mentionable !== newRole.mentionable
        ) {
            const auditLogs = await fetchAuditLogs(newRole.guild, AUDIT_LOG_TYPES.ROLE_UPDATE);
            const entry = getFirstAuditLogEntry(auditLogs);
            console.log(`Audit Log Entry for ROLE_UPDATE: ${JSON.stringify(entry)}`);
            if (!entry || !entry.executor) return;

            // Check if the executor is the bot itself or has a higher role position
            const botMember = await getBotMember(newRole.guild);
            if (entry.executor.id === botMember.id || entry.executor.roles.highest.position >= botMember.roles.highest.position) {
                console.log(`Ignoring role update by bot or user with higher role position: ${entry.executor.tag} (${entry.executor.id})`);
                return;
            }

            // Check if the executor is whitelisted (if applicable)
            if (settings.whitelistedUsers && settings.whitelistedUsers.includes(entry.executor.id)) {
                console.log(`Ignoring role update by whitelisted user: ${entry.executor.tag} (${entry.executor.id})`);
                return;
            }

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
        console.log(`Handling role delete: ${role.id} (${role.name}) in guild ${role.guild.id}`);
        const settings = await fetchSettings(role.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(role.guild, AUDIT_LOG_TYPES.ROLE_DELETE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for ROLE_DELETE: ${JSON.stringify(entry)}`);
        if (!entry || !entry.executor) return;

        // Check if the executor is the bot itself or has a higher role position
        const botMember = await getBotMember(role.guild);
        if (entry.executor.id === botMember.id || entry.executor.roles.highest.position >= botMember.roles.highest.position) {
            console.log(`Ignoring role deletion by bot or user with higher role position: ${entry.executor.tag} (${entry.executor.id})`);
            return;
        }

        // Check if the executor is whitelisted (if applicable)
        if (settings.whitelistedUsers && settings.whitelistedUsers.includes(entry.executor.id)) {
            console.log(`Ignoring role deletion by whitelisted user: ${entry.executor.tag} (${entry.executor.id})`);
            return;
        }

        await logNukeAction(entry.executor.id, role.guild.id, 'ROLE_DELETE');

        try {
            await saveStateBeforeNuke(role.guild, role, 'roles');
        } catch (error) {
            console.error(`Error saving state before role deletion: ${error.message}`);
        }

        await handleExcessiveActions(settings, role.guild, entry.executor.id, 'ROLE_DELETE', settings.maxRolesDeleted, 'role deletions');
    } catch (error) {
        console.error('Error handling role delete:', error);
    }
}

async function handleGuildMemberUpdate(oldMember, newMember) {
    try {
        console.log(`Handling guild member update: ${oldMember.id} to ${newMember.id} in guild ${newMember.guild.id}`);
        const settings = await fetchSettings(newMember.guild.id);
        if (!settings || !settings.enabled) return;

        if (oldMember.nickname !== newMember.nickname) {
            const auditLogs = await fetchAuditLogs(newMember.guild, AUDIT_LOG_TYPES.MEMBER_UPDATE);
            const entry = getFirstAuditLogEntry(auditLogs);
            console.log(`Audit Log Entry for MEMBER_UPDATE: ${JSON.stringify(entry)}`);
            if (!entry || !entry.executor) return;

            // Check if the executor is the bot itself or has a higher role position
            const botMember = await getBotMember(newMember.guild);
            if (entry.executor.id === botMember.id || entry.executor.roles.highest.position >= botMember.roles.highest.position) {
                console.log(`Ignoring nickname change by bot or user with higher role position: ${entry.executor.tag} (${entry.executor.id})`);
                return;
            }

            // Check if the executor is whitelisted (if applicable)
            if (settings.whitelistedUsers && settings.whitelistedUsers.includes(entry.executor.id)) {
                console.log(`Ignoring nickname change by whitelisted user: ${entry.executor.tag} (${entry.executor.id})`);
                return;
            }

            // Check if the bot has the necessary permissions
            if (!botMember.permissions.has('VIEW_AUDIT_LOG') || !botMember.permissions.has('MANAGE_NICKNAMES')) {
                console.log(`Bot lacks permissions to handle nickname changes in guild ${newMember.guild.id}`);
                return;
            }

            await logNukeAction(entry.executor.id, newMember.guild.id, 'NICKNAME_UPDATE');
            await handleExcessiveActions(settings, newMember.guild, entry.executor.id, 'NICKNAME_UPDATE', settings.maxNicknamesChanged, 'nickname changes');
        }
    } catch (error) {
        console.error('Error handling guild member update:', error);
    }
}

async function handleGuildMemberAdd(member) {
    try {
        console.log(`Handling guild member add: ${member.id} (${member.user.tag}) in guild ${member.guild.id}`);
        const settings = await fetchSettings(member.guild.id);
        if (!settings || !settings.enabled) return;

        const botMember = await getBotMember(member.guild);

        // Check if the bot has the necessary permissions
        if (!botMember.permissions.has('VIEW_AUDIT_LOG') || !botMember.permissions.has('BAN_MEMBERS')) {
            console.log(`Bot lacks permissions to handle member join in guild ${member.guild.id}`);
            return;
        }

        if (member.user.bot) {
            const auditLogs = await fetchAuditLogs(member.guild, AUDIT_LOG_TYPES.BOT_ADD);
            const entry = getFirstAuditLogEntry(auditLogs);
            console.log(`Audit Log Entry for BOT_ADD: ${JSON.stringify(entry)}`);
            if (!entry || !entry.executor) return;

            // Check if the executor is whitelisted (if applicable)
            if (settings.whitelistedUsers && settings.whitelistedUsers.includes(entry.executor.id)) {
                console.log(`Ignoring bot addition by whitelisted user: ${entry.executor.tag} (${entry.executor.id})`);
                return;
            }

            await logNukeAction(entry.executor.id, member.guild.id, 'BOT_ADD');
            await handleExcessiveActions(settings, member.guild, entry.executor.id, 'BOT_ADD', settings.maxBotsAdded, 'bot additions');

            // Ban the user who added the bot
            const addedByUserId = entry.executor.id;
            const addedByMember = await member.guild.members.fetch(addedByUserId);

            // Check if the user who added the bot is the guild owner or has a higher role position than the bot
            if (addedByMember.id === member.guild.ownerId || addedByMember.roles.highest.position >= botMember.roles.highest.position) {
                console.log(`Cannot ban user ${addedByUserId} for adding nuke bot in guild ${member.guild.id} due to insufficient permissions`);
                return;
            }

            console.log(`Banning user ${addedByUserId} for adding nuke bot in guild ${member.guild.id}`);
            await banMember(member.guild, addedByUserId, 'Adding nuke bot');
        } else {
            // Check if the user is whitelisted (if applicable)
            if (settings.whitelistedUsers && settings.whitelistedUsers.includes(member.id)) {
                console.log(`Ignoring user join by whitelisted user: ${member.user.tag} (${member.id})`);
                return;
            }

            await logNukeAction(member.id, member.guild.id, 'USER_JOIN');
            await handleExcessiveActions(settings, member.guild, member.id, 'USER_JOIN', settings.maxUsersAdded, 'user additions');
        }
    } catch (error) {
        console.error('Error handling guild member add:', error);
    }
}

async function handleMessageCreate(message) {
    try {
        // Ensure the message is in a guild and not a DM
        if (!message.guild) return;

        console.log(`Handling message create by ${message.author.id} in guild ${message.guild.id}`);
        const settings = await fetchSettings(message.guild.id);
        if (!settings || !settings.enabled) return;

        const botMember = await getBotMember(message.guild);

        // Check if the bot has the necessary permissions
        if (!botMember.permissions.has('BAN_MEMBERS')) {
            console.log(`Bot lacks permission to ban members in guild ${message.guild.id}`);
            return;
        }

        // Check if the user is whitelisted (if applicable)
        if (settings.whitelistedUsers && settings.whitelistedUsers.includes(message.author.id)) {
            console.log(`Ignoring message with excessive mentions by whitelisted user: ${message.author.tag} (${message.author.id})`);
            return;
        }

        const mentions = message.mentions.users.size + message.mentions.roles.size + (message.mentions.everyone ? 1 : 0);
        if (mentions >= settings.maxMentions) {
            const member = await message.guild.members.fetch(message.author.id);

            // Check if the user is the guild owner or has a higher role position than the bot
            if (member.id === message.guild.ownerId || member.roles.highest.position >= botMember.roles.highest.position) {
                console.log(`Cannot ban user ${message.author.id} for excessive mentions in guild ${message.guild.id} due to insufficient permissions`);
                return;
            }

            console.log(`Banning user ${message.author.id} for excessive mentions in guild ${message.guild.id}`);
            await banMember(message.guild, message.author.id, 'Excessive mentions');

            // Delete the message with excessive mentions
            if (message.deletable) {
                await message.delete();
            }
        }
    } catch (error) {
        console.error('Error handling message create:', error);
    }
}

async function handleWebhookCreate(channel) {
    try {
        const webhooks = await channel.fetchWebhooks();
        const webhook = webhooks.first();

        if (!webhook) {
            console.log(`No webhook found in channel ${channel.id}`);
            return;
        }

        console.log(`Handling webhook create: ${webhook.id} in guild ${webhook.guild.id}`);
        const settings = await fetchSettings(webhook.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(webhook.guild, AUDIT_LOG_TYPES.WEBHOOK_CREATE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for WEBHOOK_CREATE: ${entry ? JSON.stringify(entry) : 'No entry found'}`);
        if (!entry || !entry.executor) return;

        const executor = await webhook.guild.members.fetch(entry.executor.id).catch(() => null);
        if (!executor) {
            console.log(`Failed to fetch executor: ${entry.executor.tag} (${entry.executor.id})`);
            return;
        }

        const botMember = await getBotMember(webhook.guild);
        if (executor.id === botMember.id || executor.roles.highest.position >= botMember.roles.highest.position) {
            console.log(`Ignoring webhook creation by bot or user with higher role position: ${executor.user.tag} (${executor.id})`);
            return;
        }

        if (settings.whitelistedUsers && settings.whitelistedUsers.includes(executor.id)) {
            console.log(`Ignoring webhook creation by whitelisted user: ${executor.user.tag} (${executor.id})`);
            return;
        }

        if (!botMember.permissions.has('VIEW_AUDIT_LOG') || !botMember.permissions.has('MANAGE_WEBHOOKS') || !botMember.permissions.has('BAN_MEMBERS')) {
            console.log(`Bot lacks permissions to handle webhook creation in guild ${webhook.guild.id}`);
            return;
        }

        await logNukeAction(executor.id, webhook.guild.id, 'WEBHOOK_CREATE');
        await saveStateBeforeNuke(webhook.guild, webhook, 'webhooks');

        const recentActions = await handleExcessiveActions(settings, webhook.guild, executor.id, 'WEBHOOK_CREATE', settings.maxWebhooksCreated, 'webhook creations');
        if (recentActions) {
            console.log(`Banning user ${executor.id} for excessive webhook creations`);
            await banMember(webhook.guild, executor.id, 'Excessive webhook creations');
        }
    } catch (error) {
        console.error('Error handling webhook create:', error);
    }
}

async function handleWebhookDelete(channel) {
    try {
        const webhooks = await channel.fetchWebhooks();
        const webhook = webhooks.first();

        if (!webhook) {
            console.log(`No webhook found in channel ${channel.id}`);
            return;
        }

        console.log(`Handling webhook delete: ${webhook.id} in guild ${webhook.guild.id}`);
        const settings = await fetchSettings(webhook.guild.id);
        if (!settings || !settings.enabled) return;

        const auditLogs = await fetchAuditLogs(webhook.guild, AUDIT_LOG_TYPES.WEBHOOK_DELETE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for WEBHOOK_DELETE: ${entry ? JSON.stringify(entry) : 'No entry found'}`);
        if (!entry || !entry.executor) return;

        const executor = await webhook.guild.members.fetch(entry.executor.id).catch(() => null);
        if (!executor) {
            console.log(`Failed to fetch executor: ${entry.executor.tag} (${entry.executor.id})`);
            return;
        }

        const botMember = await getBotMember(webhook.guild);
        if (executor.id === botMember.id || executor.roles.highest.position >= botMember.roles.highest.position) {
            console.log(`Ignoring webhook deletion by bot or user with higher role position: ${executor.user.tag} (${executor.id})`);
            return;
        }

        if (settings.whitelistedUsers && settings.whitelistedUsers.includes(executor.id)) {
            console.log(`Ignoring webhook deletion by whitelisted user: ${executor.user.tag} (${executor.id})`);
            return;
        }

        if (!botMember.permissions.has('VIEW_AUDIT_LOG') || !botMember.permissions.has('MANAGE_WEBHOOKS') || !botMember.permissions.has('BAN_MEMBERS')) {
            console.log(`Bot lacks permissions to handle webhook deletion in guild ${webhook.guild.id}`);
            return;
        }

        await logNukeAction(executor.id, webhook.guild.id, 'WEBHOOK_DELETE');
        await saveStateBeforeNuke(webhook.guild, webhook, 'webhooks');

        const recentActions = await handleExcessiveActions(settings, webhook.guild, executor.id, 'WEBHOOK_DELETE', settings.maxWebhooksDeleted, 'webhook deletions');
        if (recentActions) {
            console.log(`Banning user ${executor.id} for excessive webhook deletions`);
            await banMember(webhook.guild, executor.id, 'Excessive webhook deletions');
        }
    } catch (error) {
        console.error('Error handling webhook delete:', error);
    }
}
const webhookMessageCounts = new Map();

async function handleWebhookMessage(message) {
    try {
        if (!message.webhookId) return;

        console.log(`Handling webhook message: ${message.id} from webhook ${message.webhookId} in guild ${message.guild.id}`);
        const settings = await fetchSettings(message.guild.id);
        if (!settings || !settings.enabled) return;

        const webhook = await message.client.fetchWebhook(message.webhookId).catch(() => null);
        if (!webhook) {
            console.log(`Failed to fetch webhook: ${message.webhookId}`);
            return;
        }

        const auditLogs = await fetchAuditLogs(message.guild, AUDIT_LOG_TYPES.WEBHOOK_CREATE);
        const entry = getFirstAuditLogEntry(auditLogs);
        console.log(`Audit Log Entry for WEBHOOK_MESSAGE: ${entry ? JSON.stringify(entry) : 'No entry found'}`);
        if (!entry || !entry.executor) return;

        const executor = await message.guild.members.fetch(entry.executor.id).catch(() => null);
        if (!executor) {
            console.log(`Failed to fetch executor: ${entry.executor.tag} (${entry.executor.id})`);
            return;
        }

        const botMember = await getBotMember(message.guild);
        if (executor.id === botMember.id || executor.roles.highest.position >= botMember.roles.highest.position) {
            console.log(`Ignoring webhook message by bot or user with higher role position: ${executor.user.tag} (${executor.id})`);
            return;
        }

        if (settings.whitelistedUsers && settings.whitelistedUsers.includes(executor.id)) {
            console.log(`Ignoring webhook message by whitelisted user: ${executor.user.tag} (${executor.id})`);
            return;
        }

        if (!botMember.permissions.has('VIEW_AUDIT_LOG') || !botMember.permissions.has('MANAGE_WEBHOOKS') || !botMember.permissions.has('BAN_MEMBERS') || !botMember.permissions.has('MANAGE_MESSAGES')) {
            console.log(`Bot lacks permissions to handle webhook message in guild ${message.guild.id}`);
            return;
        }

        const now = Date.now();
        if (!webhookMessageCounts.has(webhook.id)) {
            webhookMessageCounts.set(webhook.id, []);
        }

        const timestamps = webhookMessageCounts.get(webhook.id);
        timestamps.push(now);
        const recentMessages = timestamps.filter(timestamp => now - timestamp < settings.timeFrame);
        webhookMessageCounts.set(webhook.id, recentMessages);

        if (recentMessages.length >= settings.maxWebhookMessages) {
            console.log(`Webhook ${webhook.id} exceeded message limit. Deleting webhook, banning executor ${executor.id} (${executor.user.tag}), and deleting the message.`);
            
            await message.delete().catch(error => {
                console.error(`Failed to delete message ${message.id} from webhook ${webhook.id}:`, error);
            });

            await webhook.delete('Excessive webhook messages').catch(error => {
                console.error(`Failed to delete webhook ${webhook.id}:`, error);
            });

            await banMember(message.guild, executor.id, 'Excessive webhook messages');

            // Log the ban action
            await NukeLog.create({
                guildId: message.guild.id,
                userId: executor.id,
                action: 'ban',
                reason: 'Excessive webhook messages',
                timestamp: Date.now(),
            });

            webhookMessageCounts.delete(webhook.id);
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
        console.log(`Handling direct message from ${userId}`);

        // Check if the user is whitelisted (if applicable)
        if (globalSettings.whitelistedUsers && globalSettings.whitelistedUsers.includes(userId)) {
            console.log(`Ignoring direct message from whitelisted user: ${userId}`);
            return;
        }

        if (!dmMessageCounts.has(userId)) {
            dmMessageCounts.set(userId, []);
        }

        const timestamps = dmMessageCounts.get(userId);
        timestamps.push(now);
        const recentMessages = timestamps.filter(timestamp => now - timestamp < 60000);
        dmMessageCounts.set(userId, recentMessages);

        if (recentMessages.length >= 10) {
            // Check if the bot has the necessary permissions to ban users
            if (!message.client.user.bot || !message.client.user.permissions.has('BAN_MEMBERS')) {
                console.log(`Bot lacks permission to ban users`);
                return;
            }

            console.log(`Banning user ${userId} for excessive DMs`);

            try {
                // Ban the user from all shared guilds
                const sharedGuilds = message.client.guilds.cache.filter(guild => guild.members.cache.has(userId));
                for (const guild of sharedGuilds.values()) {
                    await banMember(guild, userId, 'Excessive DMs');
                }
            } catch (banError) {
                console.error(`Error banning user ${userId} for excessive DMs:`, banError);
            }
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
    restoreState,
    fetchSettings,
    fetchAuditLogs,
    getFirstAuditLogEntry,
    logNukeAction,
    banMember,
    saveStateBeforeNuke,
    getBotMember,
    notifyOwner,
    addWhitelist,
    removeWhitelist,
    isWhitelisted,
    AUDIT_LOG_TYPES,
};
