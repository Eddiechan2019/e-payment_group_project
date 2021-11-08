const block = require('../models/block.model.js');
const CryptoJS = require('crypto-js')

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class Block {

    constructor(index, timestamp, hash, previousHash, data, difficulty, nonce) {
        this.index = index;
        this.timestamp = timestamp;
        this.hash = hash;
        this.previousHash = previousHash;
        this.data = data;
        this.difficulty = difficulty;
        this.nonce = nonce;
    }
}

exports.generateGenesisBlock = (req, res) => {
    const index = 0;
    const timestamp = new Date().getTime();
    const data = 'Genesis Block';
    const previousHash = '0';
    const difficulty = 0
    const nonce = 0
    const hash = calculateHash(index, previousHash, timestamp, data, difficulty, nonce)

    const genesisblock = new block({
        index: index,
        hash: hash,
        previousHash: previousHash,
        timestamp: timestamp,
        data: data,
        difficulty: difficulty,
        nonce: nonce
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

    block.find().sort({ 'index': -1 })
        .then(data => {
            //check generate GenesisBlock is not
            if (data !== null && typeof(data) != "undefined") {
                const previousBlock = new block(data[0]);
                const nextIndex = previousBlock.index + 1;
                const nextTimeStamp = new Date().getTime()
                const block_data = (typeof(req.query.data) != "undefined" && req.query.data !== null) ? req.query.data : "";
                const difficulty = getDifficulty(previousBlock, data);
                const newblock = findblock(nextIndex, previousBlock.hash, nextTimeStamp, block_data, difficulty)

                if (isValidNewBlock(newblock, previousBlock) === true) {
                    newblock.save().then(data => {
                        res.send(data);
                    }).catch(err => {
                        res.status(500).send({
                            message: err.message || "Some error occurred while generate a new Block."
                        });
                    });
                }

            } else {
                res.send({ message: "There is not any blockdata. Please generate GenesisBlock" })
            }
        });
}

//get all block data
exports.getAllBlockData = (req, res) => {
    block.find().sort({ 'index': -1 })
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

function getDifficulty(previousBlock, allBlockData) {
    const latestBlock = previousBlock;
    if (latestBlock.index % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock.index !== 0) {
        return getAdjustedDifficulty(latestBlock, allBlockData);
    } else {
        return latestBlock.difficulty;
    }
}

function getAdjustedDifficulty(latestBlock, allBlockData) {
    //sorting - blockchain.lenght - diff.. = diffic.. + 1
    const prevAdjustmentBlock = allBlockData[DIFFICULTY_ADJUSTMENT_INTERVAL + 1]
    const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;

    if (timeTaken < timeExpected / 2) {
        return prevAdjustmentBlock + 1;
    } else if (timeTaken > timeExpected * 2) {
        return prevAdjustmentBlock.difficulty - 1;
    } else {
        return prevAdjustmentBlock.difficulty;
    }
}

//find a valid block hash we must increase the nonce as until we get a valid hash
function findblock(index, previousHash, timestamp, data, difficulty) {
    let nonce = 0;
    while (true) {
        const hash = calculateHash(index, previousHash, timestamp, data, difficulty, nonce)
        if (hashMatchesDifficulty(hash, difficulty)) {

            const newblock = new block({
                index: index,
                hash: hash,
                previousHash: previousHash,
                timestamp: timestamp,
                data: data,
                difficulty: difficulty,
                nonce: nonce
            });

            return newblock
        }
        nonce++;
    }
}

//check hash is correct in terms of difficulty
function hashMatchesDifficulty(hash, difficulty) {
    const hashInBinary = hexToBinary(hash);
    const requiredPrefix = '0'.repeat(difficulty);
    return hashInBinary.startsWith(requiredPrefix);
}

function calculateHash(index, previousHash, timestamp, data, difficulty, nonce) {
    return CryptoJS.SHA256(index + previousHash + timestamp + data + difficulty + nonce).toString();
}

function isValidNewBlock(newBlock, previousBlock) {
    if (!(newBlock instanceof block) || !(previousBlock instanceof block)) {
        console.log("invalid  type")
        return false;
    }

    if (previousBlock.index + 1 !== newBlock.index) {
        console.log("invalid index")
        return false
    }

    if (previousBlock.hash !== newBlock.previousHash) {
        console.log("same hash here")
        return false
    }

    if (newBlock.hash !== calculateHash(newBlock.index, newBlock.previousHash, newBlock.timestamp, newBlock.data, newBlock.difficulty, newBlock.nonce)) {
        console.log("invalid hash")
        return false
    }

    return true;
}

function hexToBinary(hex) {
    return ("00000000" + (parseInt(hex, 16)).toString(2)).substr(-8);
}