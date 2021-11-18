const mongoose = require('mongoose');
const Config = require('../../config/config.js');

const Transaction = mongoose.Schema({
    id: String,
    txIns: Array,
    txOuts: Array,
}, { versionKey: false });


const blockSchema = mongoose.Schema({
    index: Number,
    hash: String,
    previousHash: String,
    timestamp: Number,
    data: Array,
    difficulty: Number,
    nonce: Number
}, { versionKey: false });

module.exports = mongoose.model(Config.express_port + '_' + 'block', blockSchema);