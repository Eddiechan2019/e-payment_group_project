const mongoose = require('mongoose');
const Config = require('../../config/config.js');

const unspentTxOutSchema = mongoose.Schema({
    txOutId: String,
    txOutIndex: Number,
    address: String,
    amount: Number,
});

module.exports = mongoose.model(Config.express_port + '_' + 'unspentTxOut', unspentTxOutSchema);