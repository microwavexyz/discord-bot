const { UserStrike } = require('../models/UserStrike');
const { AntiSelfBot } = require('../models/AntiSelfBot');

async function updateUserStrikes(userId, guildId) {
  try {
    const settings = await AntiSelfBot.findOne({ guildId });
    if (!settings) return;

    const userStrike = await UserStrike.findOneAndUpdate(
      { userId, guildId },
      { $inc: { strikes: 1 }, lastStrikeTime: Date.now() },
      { upsert: true, new: true }
    );

    if (userStrike.strikes >= settings.maxStrikes) {
      // Reset strikes
      await UserStrike.updateOne({ userId, guildId }, { strikes: 0 });

      // Implement punishment (e.g., timeout or ban)
      const guild = await client.guilds.fetch(guildId);
      const member = await guild.members.fetch(userId);
      await member.timeout(3600000); // 1 hour timeout

      // Log the action
      if (settings.logChannelId) {
        const logChannel = await guild.channels.fetch(settings.logChannelId);
        await logChannel.send(`User <@${userId}> has been timed out for 1 hour due to multiple self-bot violations.`);
      }
    }
  } catch (error) {
    console.error('Error updating user strikes:', error);
  }
}

module.exports = { updateUserStrikes };