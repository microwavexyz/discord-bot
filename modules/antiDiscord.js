const mongoose = require('mongoose');
const AntiDiscord = mongoose.model('AntiDiscord');

module.exports = async (message) => {
  if (!message.guild) return; // Ignore DMs

  try {
    const settings = await AntiDiscord.findOne({ guildId: message.guild.id });
    if (settings?.enabled) {
      const discordInviteRegex = /(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/;
      
      if (discordInviteRegex.test(message.content)) {
        await message.delete().catch(console.error);
        await message.channel.send(`${message.author}, Discord invites are not allowed.`).catch(console.error);
      }
    }
  } catch (err) {
    console.error('Error in antiDiscord module:', err);
  }
};