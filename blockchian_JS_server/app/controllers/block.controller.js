const block = require('../models/block.model.js');
const CryptoJS = require('crypto-js')

class Block {

    constructor(index, timestamp, hash, previousHash, data) {
        this.index = index;
        this.timestamp = timestamp;
        this.hash = hash;
        this.previousHash = previousHash;
        this.data = data;
    }
}

exports.generateGenesisBlock = (req, res) => {
    index = 0;
    timestamp = 1636044380;
    hash = '810f9e854ade9bb8730d776ea02622b65c02b82ffa163ecfe4cb151a14412ed4';
    data = 'Genesis Block';
    previousHash = '0';

    const genesisblock = new block({
        index: index,
        hash: hash,
        previousHash: previousHash,
        timestamp: timestamp,
        data: data
    });

    genesisblock.save().then(data => {
        res.send(data);
    }).catch(err => {
        res.status(500).send({
            message: err.message || "Some error occurred while generate Gensis Block."
        });
    });
};

//req = block data
exports.generateNextBlock = (req, res) => {
    function calcuteHash(index, previousHash, timestamp, data) {
        return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
    }

    const previousBlock = this.getLatestBlock()
    const nextIndex = previousBlock.index + 1
    const nextTimeStamp = new Date().getTime()
    const nextHash = this.calcuteHash(nextIndex, previousBlock.hash, nextTimeStamp, req.data)
    return new Block(nextIndex, previousBlock.hash, nextTimeStamp, req.data, nextHash)
}

class BlockChain {
    constructor() {
        this.blocks = [this.getGenesisBlock()]
    }

    //create the  genesis block
    getGenesisBlock() {
        index = 0;
        timestamp = 1636044380;
        hash = '810f9e854ade9bb8730d776ea02622b65c02b82ffa163ecfe4cb151a14412ed4';
        data = 'Genesis Block';
        previousHash = '0';
        return new Block(index, timestamp, hash, previousHash, data);
    }

    calcuteHash(index, previousHash, timestamp, data) {
        return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
    }

    generateNextBlock(blockData) {
        const previousBlock = this.getLatestBlock()
        const nextIndex = previousBlock.index + 1
        const nextTimeStamp = new Date().getTime()
        const nextHash = this.calcuteHash(nextIndex, previousBlock.hash, nextTimeStamp, blockData)
        return new Block(nextIndex, previousBlock.hash, nextTimeStamp, blockData, nextHash)
    }

    isValidNewBlock(newBlock, previousBlock) {
        // if(
        //   !(newBlock instanceof Block) ||
        //   !(previousBlock instanceof Block)
        // ) {
        //   return false
        // }

        if (newBlock.index !== previousBlock.index + 1) {
            return false
        }

        if (newBlock.previousHash !== previousBlock.hash) {
            return false
        }

        if (this.calcuteHash(newBlock.index, newBlock.previousHash, newBlock.timestamp, newBlock.data) !== newBlock.hash) {
            return false
        }

        return true
    }
}