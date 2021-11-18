module.exports = (app) => {
    const block = require('../controllers/block.controller.js');

    app.get('/generateNextBlock', block.generateNextBlock);
    app.post('/generatenextBlockWithTransaction', block.generatenextBlockWithTransaction);


    app.get('/getAllBlockData', block.getAllBlockData);
    app.get('/getLastestBlock', block.getLastestBlock);

    //backup
    app.get('/generateGenesisBlock', block.generateGenesisBlock);
}