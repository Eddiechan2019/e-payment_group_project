const fs = require('fs');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const privateKeyLocation = 'wallet_pk'

exports.initWallet = (req, res) => {
    if (fs.existsSync(privateKeyLocation)) {
        res.send({ message: 'Private key was generated' })
    } else {
        const newPrivateKey = generatePrivatekey();

        fs.writeFileSync(privateKeyLocation, newPrivateKey);
        res.send({ message: 'new wallet with private key created' })
    }


}

exports.getPrivateFromWallet = (req, res) => {
    if (!fs.existsSync(privateKeyLocation)) {
        res.send({ message: 'Private key has not be generated ' })
    } else {
        const buffer = fs.readFileSync(privateKeyLocation, 'utf8');
        res.send(buffer.toString());
    }
}

exports.getPublicFromWallet = (req, res) => {
    if (getPrivateFromWallet() !== "") {
        res.send(getPublicFromWallet());
    } else {
        res.send({ message: "Private key has not be generated " });
    }

}

function getPrivateFromWallet() {
    if (fs.existsSync(privateKeyLocation)) {
        const buffer = fs.readFileSync(privateKeyLocation, 'utf8');
        return buffer.toString();
    } else {
        return "";
    }
}

function generatePrivatekey() {
    const key_pair = ec.genKeyPair();
    const privateKey = key_pair.getPrivate();
    return privateKey.toString(16);
}

function getPublicFromWallet() {
    const privateKey = (getPrivateFromWallet() !== "") ? getPrivateFromWallet() : "";
    const key = ec.keyFromPrivate(privateKey, 'hex');
    return key.getPublic().encode('hex');
}