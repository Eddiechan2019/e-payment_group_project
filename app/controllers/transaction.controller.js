const CryptoJS = require('crypto-js');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

//id: String
//TxIn: Array
//TxOut: Array
class Transaction {
    constructor(id, TxIn, TxOut) {
        this.id = id;

        this.txIns = TxIn;
        this.txOuts = TxOut;
    }
}

//address: String
//amount: number
class TxOut {
    constructor(address, amount) {
        this.address = address;
        this.amount = amount;
    }
}

//txOutId: String
//txOutIndex: Number
//signature: String
class TxIn {
    constructor(txOutId, txOutIndex, signature) {
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.signature = signature;
    }
}

//txOutId: String
//txOutIndex: Number
//address: String
//amount: 
class UnspentTxOut {
    constructor(txOutId, txOutIndex, address, amount) {
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.address = address;
        this.amount = amount;
    }
}

const COINBASE_AMOUNT = 50;

exports.getCoinbaseTransaction = (req, res) => {
    const address = "123456789"
    const blockIndex = 1
    const transaction = new Transaction();
    const txIn = new TxIn();
    txIn.signature = "";
    txIn.txOutId = "";
    txIn.txOutIndex = blockIndex;

    transaction.txIns = [txIn];
    transaction.txOuts = [new TxOut(address, COINBASE_AMOUNT)]
    transaction.id = generateTransactionId(transaction);
    res.send({ message: signTxIn(transaction, blockIndex, "sfdasdgafdbgdfbbf") });
}


function getCoinbaseTransaction(address, blockIndex) {
    const transcation = new Transaction();
    const txIn = new TxIn();
    txIn.signature = "";
    txIn.txOutId = "";
    txIn.txOutIndex = blockIndex;

    transcation.txIns = [txIn];
    transcation.txOuts = [new TxOut(address, COINBASE_AMOUNT)]
    transcation.id = generateTransactionId(transcation);
    return transcation;
}

//generate transaction ID
function generateTransactionId(transaction) {
    const txInContent = transaction.txIns
        .map((txIn) => txIn.txOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, '');
    const txOutContent = transaction.txOuts
        .map((txOut) => txOut.address + txOut.amount)
        .reduce((a, b) => a + b, '');

    return CryptoJS.SHA256(txInContent + txOutContent).toString();
}

function signTxIn(transaction, txInIndex, privateKey) {
    const txIn = txInIndex
    const dataToSign = transaction.id;
    // const referencedUnspentTxOut = "";
    // const referencedAddress = referencedUnspentTxOut.address;
    const key = ec.keyFromPrivate(privateKey, 'hex');
    const signature = key.sign(dataToSign).toDER().toString(16);

    return signature;
}