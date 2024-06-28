const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// In-memory storage for announcements
const announcements = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Create or edit an announcement')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new announcement')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send the announcement to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('The title of the announcement')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('The content of the announcement')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('ping_role')
                        .setDescription('The role to ping (optional)'))
                .addBooleanOption(option =>
                    option.setName('ping_everyone')
                        .setDescription('Whether to ping @everyone (optional)')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing announcement')
                .addStringOption(option =>
                    option.setName('announcement_id')
                        .setDescription('The ID of the announcement to edit')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('The new title of the announcement'))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('The new content of the announcement'))),

    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'create') {
            await this.createAnnouncement(interaction);
        } else if (interaction.options.getSubcommand() === 'edit') {
            await this.editAnnouncement(interaction);
        }
    },

    async createAnnouncement(interaction) {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const content = interaction.options.getString('content');
        const pingRole = interaction.options.getRole('ping_role');
        const pingEveryone = interaction.options.getBoolean('ping_everyone');

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(content)
            .setColor(0x0099FF)
            .setTimestamp()
            .setFooter({ text: `Announced by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

        let pingContent = '';
        if (pingRole) pingContent += `<@&${pingRole.id}> `;
        if (pingEveryone) pingContent += '@everyone';

        const message = await channel.send({ content: pingContent, embeds: [embed] });
        
        // Store the announcement
        const announcementId = `${message.id}-${Date.now()}`;
        announcements.set(announcementId, {
            messageId: message.id,
            channelId: channel.id,
            title,
            content
        });

        await interaction.reply({ content: `Announcement created successfully! ID: ${announcementId}`, ephemeral: true });
    },

    async editAnnouncement(interaction) {
        const announcementId = interaction.options.getString('announcement_id');
        const newTitle = interaction.options.getString('title');
        const newContent = interaction.options.getString('content');

        const announcement = announcements.get(announcementId);
        if (!announcement) {
            return interaction.reply({ content: 'Unable to find the specified announcement.', ephemeral: true });
        }

        try {
            const channel = await interaction.client.channels.fetch(announcement.channelId);
            const message = await channel.messages.fetch(announcement.messageId);

            if (!message.embeds.length) {
                return interaction.reply({ content: 'The specified message is not an announcement embed.', ephemeral: true });
            }

            const embed = EmbedBuilder.from(message.embeds[0]);
            if (newTitle) {
                embed.setTitle(newTitle);
                announcement.title = newTitle;
            }
            if (newContent) {
                embed.setDescription(newContent);
                announcement.content = newContent;
            }

            await message.edit({ embeds: [embed] });
            await interaction.reply({ content: 'Announcement edited successfully!', ephemeral: true });
        } catch (error) {
            console.error('Error editing announcement:', error);
            await interaction.reply({ 
                content: 'Failed to edit the announcement. This could be due to missing permissions or the message being too old to edit.',
                ephemeral: true 
            });
        }
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const choices = Array.from(announcements.entries()).map(([id, data]) => ({
            name: `${data.title} (${id})`,
            value: id
        }));
        const filtered = choices.filter(choice => choice.name.toLowerCase().includes(focusedValue.toLowerCase()));
        await interaction.respond(filtered.slice(0, 25));
    }
};
