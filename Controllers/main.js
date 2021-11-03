const CryptoJS = require('crypto-js')

// Block structure
class Block {

    constructor(index, timestamp, hash, previousHash, data, difficulty, nonce) {
        this.index = index;
        this.timestamp = timestamp;
        this.hash = hash;
        this.previousHash = previousHash;
        this.data = data;

        //for mining data
        this.difficulty = difficulty;
        this.nonce = nonce;
    }

}

class BlockChain {
    //Calculate hash value
    cacluteHash(index, timestamp, previousHash, data) {
        return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
    }

    //Get the latest block 
    getLatestBlock() {
        return this.block[this.block.length - 1]
    }

    //Generate Next Block
    generateNextBlock(blockData) {
        const previousBlock = this.getLatestBlock()
        const nextIndex = previousBlock.index + 1
        const nextTimeStamp = new Date().getTime() / 1000;
        const nextHash = this.cacluteHash(nextIndex, previousBlock.hash, nextTimeStamp, blockData)

        const newBlock = new Block(nextIndex, previousBlock.hash, nextTimeStamp, blockData, nextHash)

        return newBlock
    }

    //Check the new block is valid or not
    idVliadNewBlock(newBlock, previousBlock) {

        //check index
        if (previousBlock.index + 1 !== newBlock.index) {
            return false;
        }

        //check hash
        if (previousBlock.hash !== newBlock.previousHash) {
            return false;
        }

        //calculate whether the hash value of the new block meets the rules
        if (newBlock.hash !== this.cacluteHash(newBlock.index, newBlock.previousHashm, newBlock.timestamp, newBlock.data)) {
            return false;
        }

        return true
    }
}