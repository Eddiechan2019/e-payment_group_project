module.exports = (app) => {
    const p2p = require('../controllers/p2p.controller.js');

    app.get('/getP2PList', p2p.getP2PList);

    app.get('/getWalletAmount', p2p.getWalletAmount);
}