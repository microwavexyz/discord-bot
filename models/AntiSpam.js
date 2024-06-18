const mongoose = require('mongoose');

const antiSpamSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    offenses: { type: Number, required: true, default: 1 },
    lastOffense: { type: Date, required: true, default: Date.now },
});

antiSpamSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('AntiSpam', antiSpamSchema);
