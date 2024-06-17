const { MessageEmbed } = require('discord.js');

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
            let embed;

            if (interaction.customId === 'apply_global_moderator') {
                embed = new MessageEmbed()
                    .setTitle('Global Moderator Application')
                    .setDescription('A new Global Moderator application has been submitted')
                    .setColor('BLUE')
                    .setTimestamp()
                    .addFields(
                        { name: "Name", value: interaction.fields.getTextInputValue('name') },
                        { name: "Age", value: interaction.fields.getTextInputValue('age') },
                        { name: "Discord & Server Time", value: interaction.fields.getTextInputValue('discord_time') },
                        { name: "In-Game Name", value: interaction.fields.getTextInputValue('in_game_name') },
                        { name: "Timezone", value: interaction.fields.getTextInputValue('timezone') },
                        { name: "Problem Solution", value: interaction.fields.getTextInputValue('problem_solution') }
                    )
                    .setFooter(`UserID: ${interaction.user.id}`);
            } else if (interaction.customId === 'apply_global_admin') {
                embed = new MessageEmbed()
                    .setTitle('Global Admin Application')
                    .setDescription('A new Global Admin application has been submitted')
                    .setColor('BLUE')
                    .setTimestamp()
                    .addFields(
                        { name: "Name", value: interaction.fields.getTextInputValue('name') },
                        { name: "Age", value: interaction.fields.getTextInputValue('age') },
                        { name: "Moderator Time", value: interaction.fields.getTextInputValue('moderator_time') },
                        { name: "In-Game Name", value: interaction.fields.getTextInputValue('in_game_name') },
                        { name: "Timezone", value: interaction.fields.getTextInputValue('timezone') },
                        { name: "Issues Handling", value: interaction.fields.getTextInputValue('admin_issues_handling') },
                        { name: "Admin Responsibilities", value: interaction.fields.getTextInputValue('admin_responsibilities') },
                        { name: "Understanding Responsibilities", value: interaction.fields.getTextInputValue('admin_understanding') }
                    )
                    .setFooter(`UserID: ${interaction.user.id}`);
            } else if (interaction.customId === 'apply_minecraft_staff') {
                embed = new MessageEmbed()
                    .setTitle('Minecraft Server Staff Application')
                    .setDescription('A new Minecraft Server Staff application has been submitted')
                    .setColor('BLUE')
                    .setTimestamp()
                    .addFields(
                        { name: "Server Name", value: interaction.fields.getTextInputValue('server_name') },
                        { name: "Server Time", value: interaction.fields.getTextInputValue('server_time') },
                        { name: "Previous Experience", value: interaction.fields.getTextInputValue('previous_experience') },
                        { name: "Abuse Consequences", value: interaction.fields.getTextInputValue('abuse_consequences') },
                        { name: "Cheat Reaction", value: interaction.fields.getTextInputValue('cheat_reaction') },
                        { name: "Age", value: interaction.fields.getTextInputValue('age') },
                        { name: "In-Game Name", value: interaction.fields.getTextInputValue('in_game_name') },
                        { name: "Timezone", value: interaction.fields.getTextInputValue('timezone') }
                    )
                    .setFooter(`UserID: ${interaction.user.id}`);
            }

            const channel = interaction.guild.channels.cache.get(process.env.SUBMIT_CHANNEL_ID);
            if (channel && channel.isText()) {
                await channel.send({ embeds: [embed] });
            }
            await interaction.reply({ content: 'Your application has been submitted successfully.', ephemeral: true });
        }
    }
};
