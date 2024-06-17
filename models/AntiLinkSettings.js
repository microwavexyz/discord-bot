const mongoose = require('mongoose');

const antiLinkSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    allowDiscordLinks: { type: Boolean, default: false },
    exemptRoles: { type: [String], default: [] }, 
});

module.exports = mongoose.model('AntiLinkSettings', antiLinkSettingsSchema);
