const mongoose = require('mongoose');

const whitelistSchema = new mongoose.Schema({
    guildId: String,
    userId: String,
    webhookId: String,
});

module.exports = mongoose.model('Whitelist', whitelistSchema);
