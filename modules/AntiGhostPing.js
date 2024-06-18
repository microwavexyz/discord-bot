const mongoose = require('mongoose');

const AntiGhostPingSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('AntiGhostPing', AntiGhostPingSchema);
