const { SlashCommandBuilder } = require('@discordjs/builders');
const { showModal, ModalBuilder, TextInputBuilder, ActionRowBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('apply')
        .setDescription('Apply for a staff role.')
        .addStringOption(option =>
            option.setName('role')
                .setDescription('The role you are applying for')
                .setRequired(true)
                .addChoices(
                    { name: 'Global Moderator', value: 'global_moderator' },
                    { name: 'Global Admin', value: 'global_admin' },
                    { name: 'Minecraft Server Staff', value: 'minecraft_staff' }
                )
        ),
    async execute(interaction) {
        const role = interaction.options.getString('role');

        const rolesConfig = {
            global_moderator: {
                questions: [
                    { id: 'discord_time', label: 'Time in discord & server?' },
                    { id: 'age', label: 'What\'s your age?' },
                    { id: 'in_game_name', label: 'In-Game Name?' },
                    { id: 'timezone', label: 'Timezone?' },
                    { id: 'problem_solution', label: 'Example of problem-solving?' }
                ],
                modalTitle: 'Global Moderator Application',
                customId: 'apply_global_moderator'
            },
            global_admin: {
                questions: [
                    { id: 'moderator_time', label: 'Time as Moderator?' },
                    { id: 'admin_issues_handling', label: 'Examples of handling issues?' },
                    { id: 'admin_understanding', label: 'Understand Admin responsibilities?' },
                    { id: 'admin_responsibilities', label: 'Summary of Admin responsibilities?' },
                    { id: 'in_game_name', label: 'In-Game Name?' }
                ],
                modalTitle: 'Global Admin Application',
                customId: 'apply_global_admin'
            },
            minecraft_staff: {
                questions: [
                    { id: 'server_name', label: 'Server you are applying for?' },
                    { id: 'previous_experience', label: 'Previous staff experience?' },
                    { id: 'abuse_consequences', label: 'Understand abuse consequences?' },
                    { id: 'cheat_reaction', label: 'How to react to cheating?' },
                    { id: 'age', label: 'Age, IGN, Timezone?' }
                ],
                modalTitle: 'Minecraft Server Staff Application',
                customId: 'apply_minecraft_staff'
            }
        };

        const roleConfig = rolesConfig[role];

        if (!roleConfig) {
            return interaction.reply({ content: 'Invalid role selected.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId(roleConfig.customId)
            .setTitle(roleConfig.modalTitle);

        roleConfig.questions.forEach(question => {
            const textInput = new TextInputBuilder()
                .setCustomId(question.id)
                .setLabel(question.label.substring(0, 45))
                .setStyle(TextInputBuilder.Styles.PARAGRAPH)
                .setPlaceholder('Enter your response here')
                .setRequired(true);

            const actionRow = new ActionRowBuilder().addComponents(textInput);
            modal.addComponents(actionRow);
        });

        await showModal(modal, { client: interaction.client, interaction });
    }
};
