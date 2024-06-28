const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
        console.log(`Serving ${client.guilds.cache.size} guilds`);
        console.log(`Watching ${client.users.cache.size} users`);

        client.user.setPresence({
            activities: [{ name: '/help', type: ActivityType.Listening }],
            status: 'online',
        });

        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`Memory Usage: ${Math.round(used * 100) / 100} MB`);
    },
};