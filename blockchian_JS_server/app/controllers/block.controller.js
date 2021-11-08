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
    timestamp = new Date().getTime();
    data = 'Genesis Block';
    previousHash = '0';
    hash = CryptoJS.SHA256(index + previousHash + timestamp + data).toString();;

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

    //check previousblock

    block.findOne().sort({ 'index': -1 })
        .then(data => {
            //check generate GenesisBlock is not
            if (data !== null && typeof(data) != "undefined") {
                const previousBlock = data;
                const nextIndex = data.index + 1;
                const nextTimeStamp = new Date().getTime()
                const block_data = (typeof(req.query.data) != "undefined" && req.query.data !== null) ? req.query.data : "";

                const nextHash = calcuteHash(nextIndex, previousBlock.hash, nextTimeStamp, block_data)

                const newblock = new block({
                    index: nextIndex,
                    hash: nextHash,
                    previousHash: previousBlock.hash,
                    timestamp: nextTimeStamp,
                    data: block_data
                });

                newblock.save().then(data => {
                    res.send(data);
                }).catch(err => {
                    res.status(500).send({
                        message: err.message || "Some error occurred while generate a new Block."
                    });
                });
            } else {
                res.send({ message: "There is not any blockdata. Please generate GenesisBlock" })
            }
        });
}

//get all block data
exports.getAllBlockData = (req, res) => {
    block.find()
        .then(data => {
            res.send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving block data."
            });
        });
};

exports.getLastestBlock = (req, res) => {
    block.findOne().sort({ 'index': -1 })
        .then(data => {
            res.send(data);
        }).catch(err => {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving block data."
            });
        });
}