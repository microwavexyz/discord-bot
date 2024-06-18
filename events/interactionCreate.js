const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ModalSubmitInteraction } = require('discord-modals');
require('dotenv').config();

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        } else if (interaction.isModalSubmit()) {
            try {
                let embed;
                let applicationChannelID = process.env.APPLICATION_CHANNEL_ID;
                let acceptedChannelID = process.env.ACCEPTED_CHANNEL_ID;

                // Create the application channel if it doesn't exist
                let applicationChannel = interaction.guild.channels.cache.get(applicationChannelID);
                if (!applicationChannel) {
                    applicationChannel = await interaction.guild.channels.create('applications', {
                        type: 'text',
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: ['ViewChannel'],
                            },
                        ],
                    });
                    applicationChannelID = applicationChannel.id;
                }

                // Create the accepted applications channel if it doesn't exist
                let acceptedChannel = interaction.guild.channels.cache.get(acceptedChannelID);
                if (!acceptedChannel) {
                    acceptedChannel = await interaction.guild.channels.create('accepted-applications', {
                        type: 'text',
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: ['ViewChannel'],
                            },
                        ],
                    });
                    acceptedChannelID = acceptedChannel.id;
                }

                switch (interaction.customId) {
                    case 'apply_global_moderator':
                        embed = new EmbedBuilder()
                            .setTitle('Global Moderator Application')
                            .setDescription('A new Global Moderator application has been submitted')
                            .setColor('Blue')
                            .setTimestamp()
                            .addFields(
                                { name: 'Time in discord & server', value: interaction.fields.getTextInputValue('discord_time') },
                                { name: 'Age', value: interaction.fields.getTextInputValue('age') },
                                { name: 'In-Game Name', value: interaction.fields.getTextInputValue('in_game_name') },
                                { name: 'Timezone', value: interaction.fields.getTextInputValue('timezone') },
                                { name: 'Example of problem-solving', value: interaction.fields.getTextInputValue('problem_solution') }
                            )
                            .setFooter({ text: `UserID: ${interaction.user.id}` });
                        break;

                    case 'apply_global_admin':
                        embed = new EmbedBuilder()
                            .setTitle('Global Admin Application')
                            .setDescription('A new Global Admin application has been submitted')
                            .setColor('Blue')
                            .setTimestamp()
                            .addFields(
                                { name: 'Time as Moderator', value: interaction.fields.getTextInputValue('moderator_time') },
                                { name: 'Examples of handling issues', value: interaction.fields.getTextInputValue('admin_issues_handling') },
                                { name: 'Understand Admin responsibilities', value: interaction.fields.getTextInputValue('admin_understanding') },
                                { name: 'Summary of Admin responsibilities', value: interaction.fields.getTextInputValue('admin_responsibilities') },
                                { name: 'In-Game Name', value: interaction.fields.getTextInputValue('in_game_name') }
                            )
                            .setFooter({ text: `UserID: ${interaction.user.id}` });
                        break;

                    case 'apply_minecraft_staff':
                        embed = new EmbedBuilder()
                            .setTitle('Minecraft Server Staff Application')
                            .setDescription('A new Minecraft Server Staff application has been submitted')
                            .setColor('Blue')
                            .setTimestamp()
                            .addFields(
                                { name: 'Server you are applying for', value: interaction.fields.getTextInputValue('server_name') },
                                { name: 'Previous staff experience', value: interaction.fields.getTextInputValue('previous_experience') },
                                { name: 'Understand abuse consequences', value: interaction.fields.getTextInputValue('abuse_consequences') },
                                { name: 'How to react to cheating', value: interaction.fields.getTextInputValue('cheat_reaction') },
                                { name: 'Age, IGN, Timezone', value: interaction.fields.getTextInputValue('age') }
                            )
                            .setFooter({ text: `UserID: ${interaction.user.id}` });
                        break;

                    default:
                        return;
                }

                const buttons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('accept')
                            .setLabel('Accept')
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId('deny')
                            .setLabel('Deny')
                            .setStyle(ButtonStyle.Danger)
                    );

                const sentMessage = await applicationChannel.send({ embeds: [embed], components: [buttons] });

                const collector = sentMessage.createMessageComponentCollector({ componentType: 2, time: 86400000 });

                collector.on('collect', async i => {
                    if (i.customId === 'accept') {
                        await acceptedChannel.send({ embeds: [embed] });
                        await i.update({ content: 'Application accepted!', components: [] });
                    } else if (i.customId === 'deny') {
                        await i.update({ content: 'Application denied!', components: [] });
                    }
                });

                await interaction.reply({ content: 'Your application has been submitted successfully.', ephemeral: true });
            } catch (error) {
                console.error('Error handling modal submit interaction:', error);
                await interaction.reply({ content: 'There was an error while submitting your application. Please try again later.', ephemeral: true });
            }
        }
    }
};
