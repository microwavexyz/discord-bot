const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

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
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [row] });

        const filter = i => ['ban', 'kick'].includes(i.customId) && i.user.id === interaction.user.id;
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

            const actionRow1 = new ActionRowBuilder().addComponents(userIdInput);
            const actionRow2 = new ActionRowBuilder().addComponents(reasonInput);

            modal.addComponents(actionRow1, actionRow2);

            await i.showModal(modal);

            const modalFilter = (interaction) => interaction.customId === `${i.customId}Modal` && interaction.user.id === i.user.id;
            const modalInteraction = await i.awaitModalSubmit({ filter: modalFilter, time: 15000 });

            if (modalInteraction) {
                const userId = modalInteraction.fields.getTextInputValue('userId');
                const reason = modalInteraction.fields.getTextInputValue('reason');

                await modalInteraction.reply({ content: `Action: ${i.customId}\nUser ID: ${userId}\nReason: ${reason}`, ephemeral: true });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                interaction.editReply({ components: [] });
            }
        });
    },
};
