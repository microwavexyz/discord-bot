const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const Backup = require('../models/Backup');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('backup')
        .setDescription('Create a backup of the server configuration.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Check if the user has administrator permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You need Administrator permissions to use this command.', ephemeral: true });
        }

        try {
            const guild = interaction.guild;

            // Fetch channels and roles in parallel
            const [channels, roles] = await Promise.all([
                guild.channels.fetch(),
                guild.roles.fetch(),
            ]);

            // Map channels and roles to required data
            const channelData = channels.map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                parentID: channel.parentId,
                permissionOverwrites: channel.permissionOverwrites.cache.map(overwrite => ({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.bitfield,
                    deny: overwrite.deny.bitfield,
                })),
            }));

            const roleData = roles.map(role => ({
                id: role.id,
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                position: role.position,
                permissions: role.permissions.bitfield,
                mentionable: role.mentionable,
            }));

            // Create a new backup
            const backup = new Backup({
                guildID: guild.id,
                channels: channelData,
                roles: roleData,
            });

            // Save backup to the database
            await backup.save();

            // Ensure only the latest 3 backups are stored
            const backups = await Backup.find({ guildID: guild.id }).sort({ timestamp: -1 });
            if (backups.length > 3) {
                const backupsToDelete = backups.slice(3);
                for (const backup of backupsToDelete) {
                    await Backup.findByIdAndDelete(backup._id);
                }
            }

            // Calculate backup number
            const backupNumber = await Backup.countDocuments({ guildID: guild.id });

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Backup Created')
                .setDescription(`Backup number **${backupNumber}** has been created successfully.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error creating backup:', error);
            await interaction.reply({ content: 'An error occurred while creating the backup. Please try again later.', ephemeral: true });
        }
    },
};