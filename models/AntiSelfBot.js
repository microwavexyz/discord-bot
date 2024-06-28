const mongoose = require('mongoose');

const AntiSelfBotSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: true },
  logChannelId: { type: String, default: null },
  maxStrikes: { type: Number, default: 3 },
  strikeResetTime: { type: Number, default: 86400000 } // 24 hours in milliseconds
});

const AntiSelfBot = mongoose.model('AntiSelfBot', AntiSelfBotSchema);

module.exports = { AntiSelfBot };