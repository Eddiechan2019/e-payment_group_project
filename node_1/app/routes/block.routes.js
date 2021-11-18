module.exports = (app) => {
    const block = require('../controllers/block.controller.js');


    app.post('/sendTransaction', block.generatenextBlockWithTransaction);

    app.post('/mineBlock', block.mineBlock);

    app.get('/getAllBlockData', block.getAllBlockData);
    app.get('/getLastestBlock', block.getLastestBlock);

    //backup
    app.get('/generateGenesisBlock', block.generateGenesisBlock);

    ///coinbase transaction
    app.get('/getCoin', block.generateNextBlock);
}