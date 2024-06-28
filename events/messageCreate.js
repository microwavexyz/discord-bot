const { Events, EmbedBuilder } = require('discord.js');
const AfkUser = require('../models/AfkUser');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    try {
      await Promise.all([
        handleMentionedAfkUsers(message),
        handleAuthorAfkStatus(message)
      ]);
    } catch (error) {
      console.error('Error handling AFK status:', error);
    }
  },
};

async function handleMentionedAfkUsers(message) {
  const mentionedUsers = message.mentions.users;
  if (mentionedUsers.size === 0) return;

  const afkUsers = await AfkUser.find({
    userId: { $in: Array.from(mentionedUsers.keys()) }
  });

  for (const afkUser of afkUsers) {
    const user = mentionedUsers.get(afkUser.userId);
    const embed = createAfkEmbed(user.username, afkUser.message, '#FFFF00', 'AFK User');
    await message.channel.send({ embeds: [embed] });
  }
}

async function handleAuthorAfkStatus(message) {
  const afkUser = await AfkUser.findOneAndDelete({ userId: message.author.id });
  if (!afkUser) return;

  const embed = createAfkEmbed(message.author.username, 'is no longer AFK.', '#00FF00', 'AFK Status Removed');
  await message.channel.send({ embeds: [embed] });
}

function createAfkEmbed(username, description, color, title) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(`${username} ${description}`)
    .setColor(color)
    .setTimestamp();
}