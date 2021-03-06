const CryptoJS = require('crypto-js');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const wallet = require("./wallet.controller.js");
const valid = require("./valid_transaction.controller.js");

const Transaction = require("../models/transaction.model.js");
const UnspentTxOut = require("../models/unspentTxOut.model.js");
const TxOut = require("../models/txOut.model.js");
const TxIn = require("../models/txIn.model.js");

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
    //dont uncomment, this make a map bug
    // aTransactions = Array(aTransactions);
    // if (!valid.isValidTransactionsStructure(aTransactions)) {
    //     return null;
    // }

    // if (!valid.validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)) {
    //     console.log('invalid block transactions');
    //     return null;
    // }
    return updateUnspentTxOuts(aTransactions, aUnspentTxOuts);
}

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

//check the user has enough coins to send transaction or not
function findTxOutsForAmount(amount, myUnspentTxOuts) {
    let currentAmount = 0;
    const includedUnspentTxOuts = [];

    for (const myUnspentTxOut of myUnspentTxOuts) {
        if (myUnspentTxOut.address == wallet.getPublicFromWallet_return()) {
            includedUnspentTxOuts.push(myUnspentTxOut);
            currentAmount = currentAmount + myUnspentTxOut.amount;
            if (currentAmount >= amount) {
                const leftOverAmount = currentAmount - amount;
                return { includedUnspentTxOuts, leftOverAmount }
            }
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