module.exports = (app) => {
    const block = require('../controllers/block.controller.js');

    const transaction = require('../controllers/transaction.controller.js');

    app.get('/generateGenesisBlock', block.generateGenesisBlock);
    app.get('/generateNextBlock', block.generateNextBlock);
    app.post('/generatenextBlockWithTransaction', block.generatenextBlockWithTransaction);


    app.get('/getAllBlockData', block.getAllBlockData);
    app.get('/getLastestBlock', block.getLastestBlock);

    app.get('/test', transaction.getCoinbaseTransaction);
}