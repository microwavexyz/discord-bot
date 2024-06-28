const mongoose = require('mongoose');
const AntiCaps = mongoose.model('AntiCaps');

module.exports = async (message) => {
  if (!message.guild) return;

  try {
    const settings = await AntiCaps.findOne({ guildId: message.guild.id });
    if (settings?.enabled) {
      const messageContent = message.content;
      const capsCount = messageContent.replace(/[^A-Z]/g, "").length;
      const capsPercentage = (capsCount / messageContent.length) * 100;
      
      if (capsPercentage > settings.threshold) {
        await message.delete().catch(console.error);
        await message.channel.send(`${message.author}, please do not use excessive caps.`).catch(console.error);
      }
    }
  } catch (err) {
    console.error('Error in antiCaps module:', err);
  }
};