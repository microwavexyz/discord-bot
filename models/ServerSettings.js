const mongoose = require('mongoose');

const serverSettingsSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    adminRole: { type: String, required: true },
    maxChannelsDeleted: { type: Number, default: 3 },
    maxRolesDeleted: { type: Number, default: 3 },
    maxRoleChanges: { type: Number, default: 3 },
    maxChannelsCreated: { type: Number, default: 3 },
    maxRolesCreated: { type: Number, default: 3 },
    maxMentions: { type: Number, default: 5 },
    maxNicknamesChanged: { type: Number, default: 3 },
    maxBotsAdded: { type: Number, default: 3 },
    maxUsersAdded: { type: Number, default: 5 },
    maxChannelRenames: { type: Number, default: 3 },
    maxCategoriesCreated: { type: Number, default: 3 },
    maxCategoryRenames: { type: Number, default: 3 },  
    maxWebhookMessages: { type: Number, default: 5 },  
    timeFrame: { type: Number, default: 60000 }, 
});

module.exports = mongoose.model('ServerSettings', serverSettingsSchema);
