const { AntiSelfBot } = require('../models/AntiSelfBot');
const { updateUserStrikes } = require('./userStrikes');
const { checkUnusualBehavior } = require('./unusualBehavior');

module.exports = async (message) => {
  try {
    const settings = await AntiSelfBot.findOne({ guildId: message.guild.id });
    
    if (settings && settings.enabled) {
      if (message.author.bot) return;

      const selfBotKeywords = [
        "token", "selfbot", "self-bot", "automate", "automation", "script",
        "macro", "bot account", "user account bot", "api abuse"
      ];

      const contentLower = message.content.toLowerCase();
      const hasKeyword = selfBotKeywords.some(keyword => 
        contentLower.includes(keyword) || contentLower.split(/\s+/).includes(keyword)
      );

      if (hasKeyword) {
        await message.delete().catch(console.error);

        const warningMessage = `${message.author}, self-botting or discussion of self-bots is not allowed.`;
        await message.channel.send(warningMessage).catch(console.error);

        if (settings.logChannelId) {
          const logChannel = await message.guild.channels.fetch(settings.logChannelId);
          if (logChannel) {
            await logChannel.send(`Self-bot related content detected from ${message.author.tag} in ${message.channel}:\n\`\`\`${message.content}\`\`\``).catch(console.error);
          }
        }

        await updateUserStrikes(message.author.id, message.guild.id);
      }

      await checkUnusualBehavior(message);
    }
  } catch (err) {
    console.error('Error in antiSelfBot module:', err);
  }
};