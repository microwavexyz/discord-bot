const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Backup = require('../models/Backup');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Create a backup of the server configuration.'),
    async execute(interaction) {
        const guild = interaction.guild;

        // Fetch channels and roles
        const channels = guild.channels.cache.map(channel => ({
            id: channel.id,
            name: channel.name,
            type: channel.type,
            parentID: channel.parentId,
            permissionOverwrites: channel.permissionOverwrites.cache.map(overwrite => ({
                id: overwrite.id,
                type: overwrite.type,
                allow: overwrite.allow.toArray(),
                deny: overwrite.deny.toArray(),
            })),
        }));

        const roles = guild.roles.cache.map(role => ({
            id: role.id,
            name: role.name,
            color: role.color,
            hoist: role.hoist,
            position: role.position,
            permissions: role.permissions.toArray(),
            mentionable: role.mentionable,
        }));

        // Create a new backup
        const backup = new Backup({
            guildID: guild.id,
            channels,
            roles,
        });

        // Save backup to the database
        await backup.save();

        // Ensure only the latest 3 backups are stored
        const backups = await Backup.find({ guildID: guild.id }).sort({ timestamp: -1 });
        if (backups.length > 3) {
            const oldestBackup = backups[backups.length - 1];
            await Backup.findByIdAndDelete(oldestBackup._id);
        }

        // Calculate backup number
        const backupNumber = await Backup.countDocuments({ guildID: guild.id });

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Backup Created')
            .setDescription(`Backup number **${backupNumber}** has been created successfully.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
