class Transaction {
    constructor(id, TxIn, TxOut) {
        this.id = id;

        this.txIns = TxIn;
        this.txOuts = TxOut;
    }
}

module.exports = Transaction;