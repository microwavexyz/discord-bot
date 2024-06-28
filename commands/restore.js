const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const Backup = require('../models/Backup');

const channelTypes = {
    0: ChannelType.GuildText,
    2: ChannelType.GuildVoice,
    4: ChannelType.GuildCategory,
    5: ChannelType.GuildNews,
    13: ChannelType.GuildStageVoice,
};

async function restoreRoles(guild, roleData, interaction, loadingMessage) {
    try {
        let role = guild.roles.cache.get(roleData.id);
        if (role) {
            if (role.editable) {
                await role.edit({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: new PermissionsBitField(roleData.permissions),
                    mentionable: roleData.mentionable,
                });
            } else {
                console.warn(`Role ${roleData.name} is not editable.`);
            }
        } else {
            const existingRole = guild.roles.cache.find(r => r.name === roleData.name && r.color === roleData.color);
            if (!existingRole) {
                await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: new PermissionsBitField(roleData.permissions),
                    mentionable: roleData.mentionable,
                });
            } else {
                console.warn(`Role ${roleData.name} already exists with similar properties.`);
            }
        }
        await interaction.editReply({ content: `${loadingMessage}\nRestoring roles: ${roleData.name}...`, ephemeral: true });
    } catch (error) {
        console.error(`Error restoring role ${roleData.name}:`, error);
    }
}

async function restoreChannels(guild, channelData, interaction, loadingMessage) {
    try {
        let channel = guild.channels.cache.get(channelData.id);
        if (channel) {
            await channel.edit({
                name: channelData.name,
                parent: channelData.parentID,
                permissionOverwrites: channelData.permissionOverwrites.map(overwrite => ({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: new PermissionsBitField(overwrite.allow),
                    deny: new PermissionsBitField(overwrite.deny),
                })),
            });
        } else {
            const existingChannel = guild.channels.cache.find(channel => channel.name === channelData.name && channel.type === channelTypes[channelData.type]);
            if (!existingChannel) {
                const parentChannel = guild.channels.cache.get(channelData.parentID);
                await guild.channels.create({
                    name: channelData.name,
                    type: channelTypes[channelData.type] || ChannelType.GuildText,
                    parent: parentChannel,
                    permissionOverwrites: channelData.permissionOverwrites.map(overwrite => ({
                        id: overwrite.id,
                        type: overwrite.type,
                        allow: new PermissionsBitField(overwrite.allow),
                        deny: new PermissionsBitField(overwrite.deny),
                    })),
                });
            } else {
                console.warn(`Channel ${channelData.name} already exists with similar properties.`);
            }
        }
        await interaction.editReply({ content: `${loadingMessage}\nRestoring channels: ${channelData.name}...`, ephemeral: true });
    } catch (error) {
        console.error(`Error restoring channel ${channelData.name}:`, error);
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restore')
        .setDescription('Restore the server configuration from a backup.')
        .addIntegerOption(option => option.setName('backupnumber').setDescription('The backup number to restore').setRequired(true))
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction) {
        // Check if the user has administrator permissions
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: 'You need Administrator permissions to use this command.', ephemeral: true });
        }

        // Check if the bot has necessary permissions
        const botMember = interaction.guild.members.me;
        const requiredPermissions = [
            PermissionsBitField.Flags.ManageRoles,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.ManageGuild
        ];

        if (!botMember.permissions.has(requiredPermissions)) {
            const missingPermissions = requiredPermissions.filter(perm => !botMember.permissions.has(perm));
            return interaction.reply({ content: `I'm missing the following permissions: ${missingPermissions.join(', ')}`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const backupNumber = interaction.options.getInteger('backupnumber');

        if (backupNumber < 1) {
            return interaction.followUp({ content: 'Backup number must be a positive integer.', ephemeral: true });
        }

        const backups = await Backup.find({ guildID: guild.id }).sort({ timestamp: -1 });
        if (backupNumber > backups.length) {
            return interaction.followUp({ content: 'Invalid backup number.', ephemeral: true });
        }

        const backup = backups[backupNumber - 1];

        try {
            let loadingMessage = '⏳ Restoring server configuration...';
            await interaction.editReply({ content: loadingMessage, ephemeral: true });

            // Restore roles
            for (const roleData of backup.roles) {
                await restoreRoles(guild, roleData, interaction, loadingMessage);
            }

            // Restore channels
            for (const channelData of backup.channels) {
                await restoreChannels(guild, channelData, interaction, loadingMessage);
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Server Restored')
                .setDescription(`Server configuration has been restored from backup number **${backupNumber}**.\n\n**Restored:**\n- ${backup.roles.length} roles\n- ${backup.channels.length} channels`)
                .setTimestamp();

            await interaction.followUp({ embeds: [embed], ephemeral: true });

            // Log the restore action
            const logChannel = guild.channels.cache.find(channel => channel.name === 'mod-logs');
            if (logChannel) {
                await logChannel.send(`Server configuration restored from backup #${backupNumber} by ${interaction.user.tag}`);
            }
        } catch (error) {
            console.error('Error restoring server:', error);
            await interaction.followUp({ content: 'An error occurred while restoring the server configuration.', ephemeral: true });
        }
    },
};