exports.isValidTransactionsStructure = function(transactions) {
    return transactions
        .map(isValidTransactionStructure)
        .reduce((a, b) => (a && b), true);
}

exports.validateBlockTransactions = function(aTransactions, aUnspentTxOuts, blockIndex) {
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
    // if (address.length !== 130) {
    //     console.log('invalid public key length');
    //     return false;
    // } else if (address.match('^[a-fA-F0-9]+$') === null) {
    //     console.log('public key must contain only hex characters');
    //     return false;
    // } else if (!address.startsWith('04')) {
    //     console.log('public key must start with 04');
    //     return false;
    // }
    return true;
};

function validateCoinbaseTx(transaction, blockIndex) {
    if (transaction == null) {
        //     console.log('the first transaction in the block must be coinbase transaction');
        //     return false;
        // }
        // if (generateTransactionId(transaction) !== transaction.id) {
        //     console.log('invalid coinbase tx id: ' + transaction.id);
        //     return false;
        // }
        // if (transaction.txIns.length !== 1) {
        //     console.log('one txIn must be specified in the coinbase transaction');
        //     return;
        // }
        // if (transaction.txIns[0].txOutIndex !== blockIndex) {
        //     console.log('the txIn signature in coinbase tx must be the block height');
        //     return false;
        // }
        // if (transaction.txOuts.length !== 1) {
        //     console.log('invalid number of txOuts in coinbase transaction');
        //     return false;
        // }
        // if (transaction.txOuts[0].amount !== COINBASE_AMOUNT) {
        //     console.log('invalid coinbase amount in coinbase transaction');
        //     return false;
    }
    return true;
};