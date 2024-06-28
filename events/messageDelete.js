const { EmbedBuilder, Colors, ChannelType } = require('discord.js');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        if (message.partial) {
            try {
                await message.fetch();
            } catch (err) {
                console.error('Failed to fetch the deleted message:', err);
                return;
            }
        }

        try {
            const logChannel = message.guild.channels.cache.find(ch => ch.name === 'message-log' && ch.type === ChannelType.GuildText);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('Message Deleted')
                .setDescription(`A message by ${message.author?.tag || 'Unknown User'} was deleted in ${message.channel}.`)
                .addFields(
                    { name: 'Content', value: message.content || '[No Content]' },
                    { name: 'Message ID', value: message.id },
                    { name: 'Channel', value: `<#${message.channel.id}>` }
                )
                .setTimestamp()
                .setColor(Colors.Orange);

            if (message.attachments.size > 0) {
                embed.addFields({ name: 'Attachments', value: message.attachments.map(a => a.name).join(', ') });
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error logging deleted message:', error);
        }
    },
};