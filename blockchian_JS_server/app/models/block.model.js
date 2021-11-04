const mongoose = require('mongoose');

const blockSchema = mongoose.Schema({
    index: Number,
    hash: String,
    previousHash: String,
    timestamp: Number,
    data: String
});

module.exports = mongoose.model('block', blockSchema);