const mongoose = require('mongoose');

const BackupSchema = new mongoose.Schema({
  guildID: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  channels: { type: Array, required: true },
  roles: { type: Array, required: true },
});

module.exports = mongoose.model('Backup', BackupSchema);
