module.exports = (app) => {
    const block = require('../controllers/block.controller.js');

    const transaction = require('../controllers/transaction.controller.js');

    // // Create a new Note
    // app.post('/notes', block.create);

    // // Retrieve all Notes
    // app.get('/notes', block.findAll);

    // // Retrieve a single Note with noteId
    // app.get('/notes/:noteId', block.findOne);

    // // Update a Note with noteId
    // app.put('/notes/:noteId', block.update);

    // // Delete a Note with noteId
    // app.delete('/notes/:noteId', block.delete);

    app.get('/generateGenesisBlock', block.generateGenesisBlock);
    app.get('/generateNextBlock', block.generateNextBlock);
    app.get('/getAllBlockData', block.getAllBlockData);
    app.get('/getLastestBlock', block.getLastestBlock);
    app.get('/generatenextBlockWithTransaction', block.generatenextBlockWithTransaction);


    app.get('/test', transaction.getCoinbaseTransaction);
}