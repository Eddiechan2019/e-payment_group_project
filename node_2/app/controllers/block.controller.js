const block = require('../models/block.model.js');
const CryptoJS = require('crypto-js')

const transaction = require("./transaction.controller.js");
const wallet = require("./wallet.controller.js");

const Transaction = require("../models/transaction.model.js");
const UnspentTxOut = require("../models/unspentTxOut.model.js");
const Transaction_pool = require("../models/transaction_pool.model.js")
const unspentTxOutSchema = require("../models/unspentTxOut_mongo.model.js");

const BLOCK_GENERATION_INTERVAL = 10;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

let unspentTxOuts = [];

//done
exports.generateGenesisBlock = (req, res) => {
    block.find()
        .then(data => {
            if (data.length == 0) {
                const index = 0;
                const timestamp = new Date().getTime();
                const data = new Transaction('Genesis_Block');
                const previousHash = '0';
                const difficulty = 1
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
            } else {
                res.send({ message: "Gensis Block has generated!" })
            }
        });
};

//done
exports.generateNextBlock = (req, res) => {
    block.find().sort({ 'index': -1 })
        .then(data => {
            //check generate GenesisBlock is not
            if (data !== null && typeof(data) != "undefined" && data.length !== 0) {
                const previousBlock = new block(data[0]);
                const nextIndex = previousBlock.index + 1;
                const nextTimeStamp = new Date().getTime()
                const coinbaseTx = transaction.getCoinbaseTransaction(wallet.getPublicFromWallet_return(), 0);
                const block_data = coinbaseTx;
                const difficulty = getDifficulty(previousBlock, data);

                const transaction_pool = new Transaction_pool({
                    id: block_data.id,
                    txIns: block_data.txIns,
                    txOuts: block_data.txOuts,
                });

                transaction_pool.save().then(data => {
                    res.send(data);
                })

                // const newblock = findblock(nextIndex, previousBlock.hash, nextTimeStamp, block_data, difficulty)
                // unspentTxOutSchema.find().then(unspentTxOuts_data => {
                //     if (addBlockToChain(newblock, previousBlock, unspentTxOuts_data)) {

                //         newblock.save().then(data => {
                //             res.send(data);
                //         });

                //     }
                // })

            } else {
                res.send({ message: "Please generate GenesisBlcok" })
            }
        });
}

//done
exports.generatenextBlockWithTransaction = (req, res) => {
    block.find().sort({ 'index': -1 })
        .then(data => {
            //check generate GenesisBlock is not
            if (data !== null && typeof(data) != "undefined" && data.length !== 0) {

                const previousBlock = new block(data[0]);
                const nextIndex = previousBlock.index + 1;
                const nextTimeStamp = new Date().getTime()

                const receiverAddress = req.body.address;
                const amount = req.body.amount;

                //const coinbaseTx = transaction.getCoinbaseTransaction(wallet.getPublicFromWallet_return(), nextIndex);

                unspentTxOutSchema.find().then(unspentTxOuts_data => {
                    const tx = transaction.createTransaction(receiverAddress, amount, wallet.getPrivateFromWallet_return(), unspentTxOuts_data);

                    // const block_data = new Transaction([coinbaseTx, tx]);
                    const block_data = new Transaction(
                        tx.id,
                        tx.txIns,
                        tx.txOuts
                    );
                    const difficulty = getDifficulty(previousBlock, data);


                    //save the transaction into transaction pool
                    const transaction_pool = new Transaction_pool({
                        id: block_data.id,
                        txIns: block_data.txIns,
                        txOuts: block_data.txOuts,
                    });

                    transaction_pool.save().then(data => {
                            res.send(data);
                        })
                        // const newblock = findblock(nextIndex, previousBlock.hash, nextTimeStamp, block_data, difficulty)
                        // if (addBlockToChain(newblock, previousBlock, unspentTxOuts_data)) {
                        //     newblock.save().then(data => {
                        //         res.send(data);
                        //     });
                        // }
                })
            } else {
                res.send({ message: "Please generate GenesisBlcok" })
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

//done
function addBlockToChain(newBlock, previousBlock, unspentTxOuts_data) {
    if (isValidNewBlock(newBlock, previousBlock)) {

        const retVal = transaction.processTransactions(newBlock.data, unspentTxOuts_data, newBlock.index);
        if (retVal === null) {
            return false;
        } else {

            for (let j = 0; j < unspentTxOuts_data.length; j++) {
                unspentTxOutSchema.findByIdAndRemove(unspentTxOuts_data[j]._id)
                    .then(transaciton => {
                        if (!transaciton) {
                            console.log("unspent Transaction not found with id " + unspentTxOuts_data[j]._id)
                            return false;
                        }
                    })

            }

            for (let i = 0; i < retVal.length; i++) {
                unspentTxOuts_mongo = new unspentTxOutSchema({
                    txOutId: retVal[i].txOutId,
                    txOutIndex: retVal[i].txOutIndex,
                    address: retVal[i].address,
                    amount: retVal[i].amount,
                });

                unspentTxOuts_mongo.save();
            }

            unspentTxOuts = retVal;

            return true;
        }
    }
    return false;
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
    const prevAdjustmentBlock = allBlockData[DIFFICULTY_ADJUSTMENT_INTERVAL]
    const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken = latestBlock.timestamp - prevAdjustmentBlock.timestamp;

    if (timeTaken < timeExpected) {
        return prevAdjustmentBlock.difficulty * (timeExpected / timeTaken);
    } else if (timeTaken > timeExpected) {
        return prevAdjustmentBlock.difficulty / (timeTaken / timeExpected);
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

    // if (newBlock.hash !== calculateHash(newBlock.index, newBlock.previousHash, newBlock.timestamp, newBlock.data, newBlock.difficulty, newBlock.nonce)) {
    //     // console.log(calculateHash(newBlock.index, newBlock.previousHash, newBlock.timestamp, newBlock.data, newBlock.difficulty, newBlock.nonce))
    //     // console.log(newBlock)
    //     return false
    // }

    return true;
}

function hexToBinary(hex) {
    return ("00000000" + (parseInt(hex, 16)).toString(2)).substr(-8);
}