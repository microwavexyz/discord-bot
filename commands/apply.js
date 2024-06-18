const { SlashCommandBuilder } = require('@discordjs/builders');
const { Modal, TextInputComponent, showModal } = require('discord-modals');
const { ActionRowBuilder, TextInputBuilder } = require('@discordjs/builders');

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

        let questions;
        let modalTitle;
        let customId;

        switch (role) {
            case 'global_moderator':
                questions = [
                    { id: 'discord_time', label: 'Time in discord & server?' },
                    { id: 'age', label: 'What\'s your age?' },
                    { id: 'in_game_name', label: 'In-Game Name?' },
                    { id: 'timezone', label: 'Timezone?' },
                    { id: 'problem_solution', label: 'Example of problem-solving?' },
                ];
                modalTitle = 'Global Moderator Application';
                customId = 'apply_global_moderator';
                break;

            case 'global_admin':
                questions = [
                    { id: 'moderator_time', label: 'Time as Moderator?' },
                    { id: 'admin_issues_handling', label: 'Examples of handling issues?' },
                    { id: 'admin_understanding', label: 'Understand Admin responsibilities?' },
                    { id: 'admin_responsibilities', label: 'Summary of Admin responsibilities?' },
                    { id: 'in_game_name', label: 'In-Game Name?' },
                ];
                modalTitle = 'Global Admin Application';
                customId = 'apply_global_admin';
                break;

            case 'minecraft_staff':
                questions = [
                    { id: 'server_name', label: 'Server you are applying for?' },
                    { id: 'previous_experience', label: 'Previous staff experience?' },
                    { id: 'abuse_consequences', label: 'Understand abuse consequences?' },
                    { id: 'cheat_reaction', label: 'How to react to cheating?' },
                    { id: 'age', label: 'Age, IGN, Timezone?' },
                ];
                modalTitle = 'Minecraft Server Staff Application';
                customId = 'apply_minecraft_staff';
                break;

            default:
                return interaction.reply({ content: 'Invalid role selected.', ephemeral: true });
        }
        const modal = new Modal()
        .setCustomId(customId)
        .setTitle(modalTitle);
  
      questions.forEach(question => {
        const textInput = new TextInputComponent()
          .setCustomId(question.id)
          .setLabel(question.label.substring(0, 45))
          .setStyle('LONG')
          .setPlaceholder('Enter your response here')
          .setRequired(true);
  
        modal.addComponents(textInput);
      });
  
      await showModal(modal, { client: interaction.client, interaction });
    }
  };