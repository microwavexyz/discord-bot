const mongoose = require('mongoose');

const AntiSpamSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    offenses: { type: Number, default: 0 },
    lastOffense: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AntiSpam', AntiSpamSchema);
