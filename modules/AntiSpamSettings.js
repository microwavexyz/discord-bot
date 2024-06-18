const mongoose = require('mongoose');

const AntiSpamSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    threshold: { type: Number, default: 5 },
    timeFrame: { type: Number, default: 10000 }
});

module.exports = mongoose.model('AntiSpamSettings', AntiSpamSettingsSchema);
