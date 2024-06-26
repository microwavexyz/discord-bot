const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Helper function to update environment variables
function updateEnvVariable(key, value) {
    const envPath = path.resolve(__dirname, '..', '.env');
    const envVars = fs.readFileSync(envPath, 'utf8').split('\n').filter(line => line.trim());
    const varIndex = envVars.findIndex(line => line.startsWith(key + '='));

    if (varIndex !== -1) {
        envVars[varIndex] = `${key}=${value}`;
    } else {
        envVars.push(`${key}=${value}`);
    }

    fs.writeFileSync(envPath, envVars.join('\n'));
}

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

                let applicationChannel = interaction.guild.channels.cache.get(applicationChannelID);
                if (!applicationChannel) {
                    applicationChannel = await interaction.guild.channels.create({
                        name: 'applications',
                        type: 0,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionsBitField.Flags.ViewChannel],
                            },
                        ],
                    });

                    updateEnvVariable('APPLICATION_CHANNEL_ID', applicationChannel.id);
                    applicationChannelID = applicationChannel.id;
                }

                let acceptedChannel = interaction.guild.channels.cache.get(acceptedChannelID);
                if (!acceptedChannel) {
                    acceptedChannel = await interaction.guild.channels.create({
                        name: 'accepted-applications',
                        type: 0,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: [PermissionsBitField.Flags.ViewChannel],
                            },
                        ],
                    });
                    updateEnvVariable('ACCEPTED_CHANNEL_ID', acceptedChannel.id);
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

                await applicationChannel.send({ embeds: [embed], components: [buttons] });
                await interaction.reply({ content: 'Your application has been submitted successfully.', ephemeral: true });
            } catch (error) {
                console.error('Error handling modal submit interaction:', error);
                await interaction.reply({ content: 'There was an error while submitting your application. Please try again later.', ephemeral: true });
            }
        } else if (interaction.isButton()) {
            try {
                await interaction.deferUpdate();

                if (interaction.customId === 'accept') {
                    const embed = interaction.message.embeds[0];
                    const acceptedChannelID = process.env.ACCEPTED_CHANNEL_ID;
                    const acceptedChannel = interaction.guild.channels.cache.get(acceptedChannelID);

                    if (acceptedChannel) {
                        await acceptedChannel.send({ embeds: [embed] });
                        await interaction.message.edit({ content: 'Application accepted!', embeds: [embed], components: [] });
                        await interaction.followUp({ content: 'Application accepted!', ephemeral: true });
                    } else {
                        await interaction.followUp({ content: 'Accepted channel not found.', ephemeral: true });
                    }
                } else if (interaction.customId === 'deny') {
                    const embed = interaction.message.embeds[0];
                    await interaction.message.edit({ content: 'Application denied!', embeds: [embed], components: [] });
                    await interaction.followUp({ content: 'Application denied!', ephemeral: true });
                }
            } catch (error) {
                console.error('Error handling button interaction:', error);
                await interaction.followUp({ content: 'An error occurred while processing the application.', ephemeral: true });
            }
        }
    },
};