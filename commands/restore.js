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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('restore')
        .setDescription('Restore the server configuration from a backup.')
        .addIntegerOption(option => option.setName('backupnumber').setDescription('The backup number to restore').setRequired(true)),
    async execute(interaction) {
        // Defer the reply to avoid timeout
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const backupNumber = interaction.options.getInteger('backupnumber');

        const backups = await Backup.find({ guildID: guild.id }).sort({ timestamp: -1 });
        if (backupNumber < 1 || backupNumber > backups.length) {
            return interaction.followUp({ content: 'Invalid backup number.', ephemeral: true });
        }

        const backup = backups[backupNumber - 1];

        // Restore roles
        try {
            for (const roleData of backup.roles) {
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
                        console.error(`Role ${roleData.name} is not editable.`);
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
                        console.error(`Role ${roleData.name} already exists with similar properties.`);
                    }
                }
            }
        } catch (error) {
            console.error('Error restoring roles:', error);
            return interaction.followUp({ content: 'Failed to restore roles.', ephemeral: true });
        }

        // Restore channels
        try {
            for (const channelData of backup.channels) {
                console.log('Restoring channel:', channelData);  // Log channel data for debugging
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
                    const existingChannel = guild.channels.cache.find(c => c.name === channelData.name && c.type === channelTypes[channelData.type]);
                    if (!existingChannel) {
                        await guild.channels.create({
                            name: channelData.name,
                            type: channelTypes[channelData.type] || ChannelType.GuildText, // Default to text if type is invalid
                            parent: channelData.parentID,
                            permissionOverwrites: channelData.permissionOverwrites.map(overwrite => ({
                                id: overwrite.id,
                                type: overwrite.type,
                                allow: new PermissionsBitField(overwrite.allow),
                                deny: new PermissionsBitField(overwrite.deny),
                            })),
                        });
                    } else {
                        console.error(`Channel ${channelData.name} already exists with similar properties.`);
                    }
                }
            }
        } catch (error) {
            console.error('Error restoring channels:', error);
            return interaction.followUp({ content: 'Failed to restore channels.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Server Restored')
            .setDescription(`Server configuration has been restored from backup number **${backupNumber}**.`)
            .setTimestamp();

        await interaction.followUp({ embeds: [embed], ephemeral: true });
    },
};
