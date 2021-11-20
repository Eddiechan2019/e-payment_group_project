module.exports = (app) => {
    const p2p = require('../controllers/p2p.controller.js');

    app.get('/addPeer', p2p.connecToPeers);
    app.get('/getP2PList', p2p.getP2PList)

    app.get('/broadCastTransactionPool', p2p.broadCastTransactionPool)
    app.get('/broadCastBlockchain', p2p.broadCastBlockchain)

    app.get('/getWalletAmount', p2p.getWalletAmount);
}