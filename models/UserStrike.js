const mongoose = require('mongoose');

const UserStrikeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  strikes: { type: Number, default: 0 },
  lastStrikeTime: { type: Date, default: Date.now }
});

UserStrikeSchema.index({ userId: 1, guildId: 1 }, { unique: true });

const UserStrike = mongoose.model('UserStrike', UserStrikeSchema);

module.exports = { UserStrike };