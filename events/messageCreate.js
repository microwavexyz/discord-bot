const { Events } = require('discord.js');
const AfkUser = require('../models/AfkUser');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    try {
      // Check if the message mentions an AFK user
      const mentionedUsers = message.mentions.users;

      if (mentionedUsers.size > 0) {
        const afkPromises = mentionedUsers.map(user =>
          AfkUser.findOne({ userId: user.id }).then(afkUser => {
            if (afkUser) {
              message.channel.send(`${user.username} is currently AFK: ${afkUser.message}`);
            }
          })
        );
        await Promise.all(afkPromises);
      }

      // Check if the message author is AFK and remove the AFK status
      const afkUser = await AfkUser.findOne({ userId: message.author.id });
      if (afkUser) {
        await AfkUser.deleteOne({ userId: message.author.id });
        message.channel.send(`${message.author.username} is no longer AFK.`);
      }
    } catch (error) {
      console.error('Error handling AFK status:', error);
    }
  },
};
