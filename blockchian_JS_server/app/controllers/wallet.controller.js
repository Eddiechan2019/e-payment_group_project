const EC = require('elliptic');

const privateKeyLocation = ''

function generatePrivatekey() {
    const key_pair = EC.genKeyPair();
    const privateKey = key_pair.getPrivate();
    return privateKey.toString(16);
}

function getPublicFromWallet() {
    const privateKey = getPrivateFromWallet();
    const key = EC.keyFromPrivate(privateKey, 'hex');
    return key.getPublic().encode('hex');
}

function initWallet() {
    if (existsSync(privateKeyLocation)) {
        return;
    }

    const newPrivateKey = generatePrivatekey();

    writeFileSync(privateKeyLocation, newPrivateKey);
    console.log('new wallet with private key created');
}