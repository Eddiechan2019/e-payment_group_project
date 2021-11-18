const mongoose = require('mongoose');
const Config = require('../../config/config.js');

const transaction_pool = mongoose.Schema({
    id: String,
    txIns: Array,
    txOuts: Array,
}, { versionKey: false });

module.exports = mongoose.model(Config.express_port + '_' + 'Transaction_pool', transaction_pool);