const { EmbedBuilder, Colors } = require('discord.js');
const AntiGhostPing = require('../models/AntiGhostPing');

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

        const guildId = message.guild.id;
        const settings = await AntiGhostPing.findOne({ guildId });

        if (!settings || !settings.enabled) return;

        if (message.mentions.users.size > 0) {
            const ghostPingChannel = message.guild.channels.cache.find(ch => ch.name === 'ghost-ping-log');
            if (!ghostPingChannel) return;

            const embed = new EmbedBuilder()
                .setTitle('Ghost Ping Detected')
                .setDescription(`A message by ${message.author.tag} was deleted.`)
                .addFields(
                    { name: 'Content', value: message.content ? message.content : '[No Content]' },
                    { name: 'Mentions', value: message.mentions.users.map(user => user.tag).join(', ') }
                )
                .setTimestamp()
                .setColor(Colors.Red);

            ghostPingChannel.send({ embeds: [embed] });
        }
    },
};
