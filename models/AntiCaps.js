const mongoose = require('mongoose');

const antiCapsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  threshold: { type: Number, default: 70 }
});

module.exports = mongoose.model('AntiCaps', antiCapsSchema);