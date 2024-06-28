const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function updateEnvVariable(key, value) {
    const envPath = path.resolve(__dirname, '..', '.env');
    let envContent = await fs.readFile(envPath, 'utf8');
    const envVars = envContent.split('\n').filter(line => line.trim());
    const varIndex = envVars.findIndex(line => line.startsWith(`${key}=`));

    if (varIndex !== -1) {
        envVars[varIndex] = `${key}=${value}`;
    } else {
        envVars.push(`${key}=${value}`);
    }

    await fs.writeFile(envPath, envVars.join('\n'));
    process.env[key] = value;
}

async function getOrCreateChannel(guild, channelName, envKey) {
    let channel = guild.channels.cache.get(process.env[envKey]);
    if (!channel) {
        channel = await guild.channels.create({
            name: channelName,
            type: 0,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });
        await updateEnvVariable(envKey, channel.id);
    }
    return channel;
}

const applicationTypes = {
    apply_global_moderator: {
        title: 'Global Moderator Application',
        color: 'Blue',
        fields: [
            { name: 'Time in discord & server', key: 'discord_time' },
            { name: 'Age', key: 'age' },
            { name: 'In-Game Name', key: 'in_game_name' },
            { name: 'Timezone', key: 'timezone' },
            { name: 'Example of problem-solving', key: 'problem_solution' }
        ]
    },
    apply_global_admin: {
        title: 'Global Admin Application',
        color: 'Blue',
        fields: [
            { name: 'Time as Moderator', key: 'moderator_time' },
            { name: 'Examples of handling issues', key: 'admin_issues_handling' },
            { name: 'Understand Admin responsibilities', key: 'admin_understanding' },
            { name: 'Summary of Admin responsibilities', key: 'admin_responsibilities' },
            { name: 'In-Game Name', key: 'in_game_name' }
        ]
    },
    apply_minecraft_staff: {
        title: 'Minecraft Server Staff Application',
        color: 'Blue',
        fields: [
            { name: 'Server you are applying for', key: 'server_name' },
            { name: 'Previous staff experience', key: 'previous_experience' },
            { name: 'Understand abuse consequences', key: 'abuse_consequences' },
            { name: 'How to react to cheating', key: 'cheat_reaction' },
            { name: 'Age, IGN, Timezone', key: 'age' }
        ]
    }
};

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            if (interaction.isCommand()) {
                await handleCommand(interaction, client);
            } else if (interaction.isModalSubmit()) {
                await handleModalSubmit(interaction);
            } else if (interaction.isButton()) {
                if (interaction.deferred || interaction.replied) {
                    console.log('Interaction already handled');
                    return;
                }
                await handleButtonInteraction(interaction);
            }
        } catch (error) {
            console.error('Error in interaction handler:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true }).catch(console.error);
            }
        }
    },
};;

async function handleCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
}

async function handleModalSubmit(interaction) {
    const applicationType = applicationTypes[interaction.customId];
    if (!applicationType) return;

    const applicationChannel = await getOrCreateChannel(interaction.guild, 'applications', 'APPLICATION_CHANNEL_ID');
    await getOrCreateChannel(interaction.guild, 'accepted-applications', 'ACCEPTED_CHANNEL_ID');

    const embed = new EmbedBuilder()
        .setTitle(applicationType.title)
        .setDescription('A new application has been submitted')
        .setColor(applicationType.color)
        .setTimestamp()
        .addFields(applicationType.fields.map(field => ({
            name: field.name,
            value: interaction.fields.getTextInputValue(field.key)
        })))
        .setFooter({ text: `UserID: ${interaction.user.id}` });

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
}

async function handleButtonInteraction(interaction) {
    try {
        // Check if the message still exists
        const message = await interaction.channel.messages.fetch(interaction.message.id).catch(() => null);
        if (!message) {
            console.log('Message no longer exists, cannot update.');
            return await interaction.reply({ content: 'This application has already been processed.', ephemeral: true });
        }

        await interaction.deferUpdate();

        const embed = interaction.message.embeds[0];
        const isAccepted = interaction.customId === 'accept';
        const status = isAccepted ? 'accepted' : 'denied';

        if (isAccepted) {
            const acceptedChannel = interaction.guild.channels.cache.get(process.env.ACCEPTED_CHANNEL_ID);
            if (acceptedChannel) {
                await acceptedChannel.send({ embeds: [embed] });
            } else {
                console.error('Accepted channel not found');
            }
        }

        await message.edit({ content: `Application ${status}!`, embeds: [embed], components: [] });
        await interaction.followUp({ content: `Application ${status}!`, ephemeral: true });
    } catch (error) {
        console.error('Error handling button interaction:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred while processing the application.', ephemeral: true }).catch(console.error);
        }
    }
}