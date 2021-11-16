const mongoose = require('mongoose');

const transacion_pool = mongoose.Schema({
    id: String,
    txIns: Array,
    txOuts: Array,
});

module.exports = mongoose.model('Transacion_pool', transacion_pool);