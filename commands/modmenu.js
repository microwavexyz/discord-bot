const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
const caseManager = require('../utils/casemanager');

const warningsFile = path.join(__dirname, '../data/warnings.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modmenu')
        .setDescription('Displays a moderation menu with actions'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Moderation Menu')
            .setDescription('Choose an action:')
            .setColor(0x00AE86);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ban')
                    .setLabel('Ban')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('kick')
                    .setLabel('Kick')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('warn')
                    .setLabel('Warn')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('timeout')
                    .setLabel('Timeout')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = i => ['ban', 'kick', 'warn', 'timeout'].includes(i.customId) && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            const modal = new ModalBuilder()
                .setCustomId(`${i.customId}Modal`)
                .setTitle(`${i.customId.charAt(0).toUpperCase() + i.customId.slice(1)} User`);

            const userIdInput = new TextInputBuilder()
                .setCustomId('userId')
                .setLabel('User ID')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter the user ID')
                .setRequired(true);

            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Enter the reason for this action')
                .setRequired(true);

            const durationInput = new TextInputBuilder()
                .setCustomId('duration')
                .setLabel('Duration (optional, for timeout in minutes)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Enter the duration in minutes (for timeout only)')
                .setRequired(false);

            const actionRow1 = new ActionRowBuilder().addComponents(userIdInput);
            const actionRow2 = new ActionRowBuilder().addComponents(reasonInput);

            modal.addComponents(actionRow1, actionRow2);

            if (i.customId === 'timeout') {
                const actionRow3 = new ActionRowBuilder().addComponents(durationInput);
                modal.addComponents(actionRow3);
            }

            await i.showModal(modal);

            const modalFilter = interaction => interaction.customId === `${i.customId}Modal` && interaction.user.id === i.user.id;

            try {
                const modalInteraction = await i.awaitModalSubmit({ filter: modalFilter, time: 15000 });

                if (modalInteraction) {
                    const userId = modalInteraction.fields.getTextInputValue('userId');
                    const reason = modalInteraction.fields.getTextInputValue('reason');

                    let responseMessage = `Action: ${i.customId}\nUser ID: ${userId}\nReason: ${reason}`;

                    try {
                        const member = await interaction.guild.members.fetch(userId);

                        switch (i.customId) {
                            case 'ban':
                                await member.ban({ reason });
                                responseMessage = `User ${member.user.tag} has been banned.\n${responseMessage}`;
                                break;
                            case 'kick':
                                await member.kick(reason);
                                responseMessage = `User ${member.user.tag} has been kicked.\n${responseMessage}`;
                                break;
                            case 'warn':
                                // Existing warn logic
                                let warnings = {};
                                if (fs.existsSync(warningsFile)) {
                                    warnings = JSON.parse(fs.readFileSync(warningsFile, 'utf-8'));
                                }

                                if (!warnings[userId]) {
                                    warnings[userId] = [];
                                }

                                warnings[userId].push({ reason, date: new Date().toISOString() });

                                fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));

                                const caseNumber = caseManager.createCase(member.user.tag, interaction.user.tag, 'warn', reason);
                                responseMessage = `User ${member.user.tag} has been warned.\n${responseMessage}\nCase #${caseNumber}`;
                                break;
                            case 'timeout':
                                const duration = modalInteraction.fields.getTextInputValue('duration');
                                if (duration) {
                                    await member.timeout(duration * 60 * 1000, reason);
                                    responseMessage = `User ${member.user.tag} has been timed out for ${duration} minutes.\n${responseMessage}`;
                                } else {
                                    responseMessage = `No duration provided for timeout.\n${responseMessage}`;
                                }
                                break;
                        }
                    } catch (error) {
                        responseMessage = `Failed to perform action. Error: ${error.message}\n${responseMessage}`;
                    }

                    await modalInteraction.reply({ content: responseMessage, ephemeral: true });
                }
            } catch (error) {
                if (error.code === 'InteractionCollectorError') {
                    await i.reply({ content: 'Modal submission timed out. Please try again.', ephemeral: true });
                } else {
                    console.error('Error in modal submission:', error);
                    await i.reply({ content: 'An error occurred during modal submission. Please try again later.', ephemeral: true });
                }
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ components: [] });
            }
        });
    },
};
