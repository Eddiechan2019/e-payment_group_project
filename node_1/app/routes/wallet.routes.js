module.exports = (app) => {
    const wallet = require('../controllers/wallet.controller.js');

    app.get('/initWallet', wallet.initWallet);

    app.get('/getPrivate', wallet.getPrivateFromWallet);
    app.get('/getPublic', wallet.getPublicFromWallet);

}