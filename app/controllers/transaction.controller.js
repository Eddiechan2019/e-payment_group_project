const CryptoJS = require('crypto-js');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const wallet = require("./wallet.controller.js");

const Transaction = require("../models/transaction.model.js");
const UnspentTxOut = require("../models/unspentTxOut.model.js");

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

    //res.send(transaction);
    return transaction;
}

function updateUnspentTxOuts(newTransactions, aUnspentTxOuts) {
    //unconsumed transaction outputs in the transaction data of the block are parsed out
    const newUnspentTxOuts = newTransactions
        .map((t) => {
            return t.txOuts.map((txOut, index) => new UnspentTxOut(t.id, index, txOut.address, txOut.amount));
        })
        .reduce((a, b) => a.concat(b), []);

    //Find out which untransacted outputs will be consumed by this new block
    const consumedTxOuts = newTransactions
        .map((t) => t.txIns)
        .reduce((a, b) => a.concat(b), [])
        .map((txIn) => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, '', 0));

    //Delete already consumed and add new unconsumed
    const resultingUnspentTxOuts = aUnspentTxOuts
        .filter(((uTxO) => !findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts)))
        .concat(newUnspentTxOuts);

    return resultingUnspentTxOuts;
}

exports.processTransactions = function(aTransactions, aUnspentTxOuts, blockIndex) {
    aTransactions = Array(aTransactions);
    if (!isValidTransactionsStructure(aTransactions)) {
        return null;
    }

    if (!validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)) {
        console.log('invalid block transactions');
        return null;
    }
    return updateUnspentTxOuts(aTransactions, aUnspentTxOuts);
}

function isValidTransactionsStructure(transactions) {
    return transactions
        .map(isValidTransactionStructure)
        .reduce((a, b) => (a && b), true);
}

function validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex) {
    const coinbaseTx = aTransactions[0];
    if (!validateCoinbaseTx(coinbaseTx, blockIndex)) {
        console.log('invalid coinbase transaction: ' + JSON.stringify(coinbaseTx));
        return false;
    }

    // // check for duplicate txIns. Each txIn can be included only once
    // const txIns = aTransactions
    //     .map((tx) => tx.txIns)
    //     .flatten()
    //     .value();

    // if (hasDuplicates(txIns)) {
    //     return false;
    // }

    // all but coinbase transactions
    const normalTransactions = aTransactions.slice(1);
    return normalTransactions.map((tx) => validateTransaction(tx, aUnspentTxOuts))
        .reduce((a, b) => (a && b), true);
}

function isValidTransactionStructure(transaction) {
    if (typeof transaction.id !== 'string') {
        console.log('transactionId missing');
        return false;
    }
    if (!(transaction.txIns instanceof Array)) {
        console.log('invalid txIns type in transaction');
        return false;
    }
    if (!transaction.txIns
        .map(isValidTxInStructure)
        .reduce((a, b) => (a && b), true)) {
        return false;
    }

    if (!(transaction.txOuts instanceof Array)) {
        console.log('invalid txIns type in transaction');
        return false;
    }

    if (!transaction.txOuts
        .map(isValidTxOutStructure)
        .reduce((a, b) => (a && b), true)) {
        return false;
    }
    return true;
}

function isValidTxInStructure(txIn) {
    if (txIn == null) {
        console.log('txIn is null');
        return false;
    } else if (typeof txIn.signature !== 'string') {
        console.log('invalid signature type in txIn');
        return false;
    } else if (typeof txIn.txOutId !== 'string') {
        console.log('invalid txOutId type in txIn');
        return false;
    } else if (typeof txIn.txOutIndex !== 'number') {
        console.log('invalid txOutIndex type in txIn');
        return false;
    } else {
        return true;
    }
};

function isValidTxOutStructure(txOut) {
    if (txOut == null) {
        console.log('txOut is null');
        return false;
    } else if (typeof txOut.address !== 'string') {
        console.log('invalid address type in txOut');
        return false;
    } else if (!isValidAddress(txOut.address)) {
        console.log('invalid TxOut address');
        return false;
    } else if (typeof txOut.amount !== 'number') {
        console.log('invalid amount type in txOut');
        return false;
    } else {
        return true;
    }
};

function isValidAddress(address) {
    if (address.length !== 130) {
        console.log('invalid public key length');
        return false;
    } else if (address.match('^[a-fA-F0-9]+$') === null) {
        console.log('public key must contain only hex characters');
        return false;
    } else if (!address.startsWith('04')) {
        console.log('public key must start with 04');
        return false;
    }
    return true;
};

function validateCoinbaseTx(transaction, blockIndex) {
    if (transaction == null) {
        console.log('the first transaction in the block must be coinbase transaction');
        return false;
    }
    if (generateTransactionId(transaction) !== transaction.id) {
        console.log('invalid coinbase tx id: ' + transaction.id);
        return false;
    }
    if (transaction.txIns.length !== 1) {
        console.log('one txIn must be specified in the coinbase transaction');
        return;
    }
    if (transaction.txIns[0].txOutIndex !== blockIndex) {
        console.log('the txIn signature in coinbase tx must be the block height');
        return false;
    }
    if (transaction.txOuts.length !== 1) {
        console.log('invalid number of txOuts in coinbase transaction');
        return false;
    }
    if (transaction.txOuts[0].amount !== COINBASE_AMOUNT) {
        console.log('invalid coinbase amount in coinbase transaction');
        return false;
    }
    return true;
};

//for mining get coint
exports.getCoinbaseTransaction = function(address, blockIndex) {
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

exports.createTransaction = function(receiverAddress, amount, privateKey, unspentTxOuts) {
    const myAddress = wallet.getPublicFromWallet_return();
    const myUnspentTxOuts = unspentTxOuts.filter((uTxO) => uTxO.address === myAddress);
    const { includedUnspentTxOuts, leftOverAmount } = findTxOutsForAmount(amount, myUnspentTxOuts);

    // function toUnsignedTxIn(unspentTxOut) {
    //     const txIn = new TxIn();
    //     txIn.txOutId = unspentTxOut.txOutId;
    //     txIn.txOutIndex = "test";
    //     return txIn;
    // }

    const toUnsignedTxIn = (unspentTxOuts) => {
        const txIn = new TxIn();
        txIn.txOutId = unspentTxOuts.txOutId;
        txIn.txOutIndex = unspentTxOuts.txOutIndex;
        return txIn;
    };

    const unsignedTxIns = includedUnspentTxOuts.map(toUnsignedTxIn);

    const tx = new Transaction();
    tx.txIns = unsignedTxIns;
    tx.txOuts = createTxOuts(receiverAddress, myAddress, amount, leftOverAmount);
    tx.id = generateTransactionId(tx);

    tx.txIns.map((txIn, index) => {
        txIn.signature = signTxIn(tx, index, privateKey, unspentTxOuts);
        return txIn;
    });

    return tx;
}

function createTxOuts(receiverAddress, myAddress, amount, leftOverAmount) {
    const txOut1 = new TxOut(receiverAddress, amount);
    if (leftOverAmount === 0) {
        return [txOut1];
    } else {
        const leftOverTx = new TxOut(myAddress, leftOverAmount);
        return [txOut1, leftOverTx];
    }
}

function findTxOutsForAmount(amount, myUnspentTxOuts) {
    let currentAmount = 0;
    const includedUnspentTxOuts = [];

    for (const myUnspentTxOut of myUnspentTxOuts) {
        includedUnspentTxOuts.push(myUnspentTxOut);
        currentAmount = currentAmount + myUnspentTxOut.amount;
        if (currentAmount >= amount) {
            const leftOverAmount = currentAmount - amount;
            return { includedUnspentTxOuts, leftOverAmount }
        }
    }
    throw Error('not enough coins to send transaction');
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

function signTxIn(transaction, txInIndex, privateKey, aUnspentTxOuts) {
    const txIn = transaction.txIns[txInIndex]
    const dataToSign = transaction.id;
    const referencedUnspentTxOut = findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts);;
    if (referencedUnspentTxOut == null) {
        return "could not find referenced txOut";
    }
    const referencedAddress = referencedUnspentTxOut.address;
    if (wallet.getPublicFromWallet_return() !== referencedAddress) {
        console.log('trying to sign an input with private' +
            ' key that does not match the address that is referenced in txIn');
        throw Error();
    }

    const key = ec.keyFromPrivate(privateKey, 'hex');
    const signature = key.sign(dataToSign).toDER().toString(16);

    return signature;
}

function findUnspentTxOut(transactionId, index, aUnspentTxOuts) {
    return aUnspentTxOuts.find((uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index);
}