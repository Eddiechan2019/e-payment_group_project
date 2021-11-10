const mongoose = require('mongoose');

const unspentTxOutSchema = mongoose.Schema({
    txOutId: String,
    txOutIndex: Number,
    address: String,
    amount: Number,
});

module.exports = mongoose.model('unspentTxOut', unspentTxOutSchema);