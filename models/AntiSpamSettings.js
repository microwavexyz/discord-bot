const mongoose = require('mongoose');

const antiSpamSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    timeFrame: { type: Number, required: true, default: 10000 }, // Time frame in milliseconds
    threshold: { type: Number, required: true, default: 5 }, // Number of messages in the time frame
});

module.exports = mongoose.model('AntiSpamSettings', antiSpamSettingsSchema);
