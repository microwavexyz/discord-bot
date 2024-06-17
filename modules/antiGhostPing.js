const AntiGhostPing = require('../models/AntiGhostPing');

module.exports = {
    async handleMessage(message) {
        if (message.author.bot) return;

        const guildId = message.guild.id;
        const settings = await AntiGhostPing.findOne({ guildId });

        if (!settings || !settings.enabled) return;

        const mentions = message.mentions.members;
        const members = await message.guild.members.fetch();

        mentions.forEach(member => {
            if (!members.has(member.id)) {
                message.delete();
                message.channel.send(`${message.author}, you tried to mention a non-existent member!`);
            }
        });
    }
};
