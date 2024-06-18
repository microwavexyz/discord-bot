const mongoose = require('mongoose');

const GlobalModeratorApplicationSchema = new mongoose.Schema({
    userID: { type: String, required: true },
    answers: { type: Array, required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('GlobalModeratorApplication', GlobalModeratorApplicationSchema);
