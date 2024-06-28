const mongoose = require('mongoose');

const afkUserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('AfkUser', afkUserSchema);
