//txOutId: String
//txOutIndex: Number
//address: String
//amount: Number
class UnspentTxOut {
    constructor(txOutId, txOutIndex, address, amount) {
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.address = address;
        this.amount = amount;
    }
}

module.exports = UnspentTxOut