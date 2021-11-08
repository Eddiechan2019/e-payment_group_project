const CryptoJS = require('crypto-js')

//id: String
//TxIn: Array
//TxOut: Array
class transaction {
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

function getTransaction(transaction) {
    const txIncontent = transaction.txIns.map((txIn) => txIn.txOutId + txIn.txOutIndex).reduce((a, b) => a + b, '');
    const txOutContent = transaction.txOuts.map((txOut) => txOut.address + txOut.amount).reduce((a, b) => a + b, '');

    return CryptoJS.SHA256(txInContent + txOutContent).toString();
}

function signTxIn(transcation, txInIndex, privateKey, aUnspentTxOuts) {
    const txIn = transaction.txIns
}