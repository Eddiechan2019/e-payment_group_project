const mongoose = require('mongoose');

const Transaction = mongoose.Schema({
    id: String,
    txIns: Array,
    txOuts: Array,
});


const blockSchema = mongoose.Schema({
    index: Number,
    hash: String,
    previousHash: String,
    timestamp: Number,
    data: Transaction,
    difficulty: Number,
    nonce: Number
});

module.exports = mongoose.model('block', blockSchema);