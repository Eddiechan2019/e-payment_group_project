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

module.exports = TxIn;