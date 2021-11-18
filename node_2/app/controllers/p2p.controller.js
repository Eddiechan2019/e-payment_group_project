const WebSocket = require('ws');
const WebSocketServer = require('ws').Server;

const url = require('url')
const Config = require('../../config/config.js');
const wallet = require("./wallet.controller.js");
const block_controller = require('./block.controller.js');

const Message = require("../models/p2p_message.model.js");
const Transaction_pool = require("../models/transaction_pool.model.js")
const block = require('../models/block.model.js');

const p2p_port = 8000;

// ws_server = new WebSocket({ port: p2p_port });
const public_key = wallet.getPublicFromWallet_return();
const ws = new WebSocket("ws://localhost:" + p2p_port + "/" + public_key, 'echo-protocol');

//how many user on the p2p network
const index = ['0'];
// store the message
const wsArray = {};

ws.onopen = function() {
    console.log('Connected to blockchain p2p' + ' Network Port = ' + p2p_port);

    exports.queryForBlockchainData();
};

ws.onmessage = function(received_data) {
    message = JSON.parse(received_data.data);

    if (typeof message.type !== 'undefined') {

        //receive the blockchain data
        if (message.type == "MessageType.RESPONSE_BLOCKCHAIN") {
            const receivedBlockData = message.data;
            if (receivedBlockData === null) {
                console.log('invalid blockchain data received: %s', JSON.stringify(message.data));
            } else {

                //update blockchain data in user database
                block.find().then(block_data => {

                    if (block_data.length >= receivedBlockData.length) {
                        console.log("Blockchian data already up to date.")
                    } else {
                        for (let i = block_data.length; i < receivedBlockData.length; i++) {

                            const new_block = new block({
                                index: receivedBlockData[i].index,
                                hash: receivedBlockData[i].hash,
                                previousHash: receivedBlockData[i].previousHash,
                                timestamp: receivedBlockData[i].timestamp,
                                data: receivedBlockData[i].data,
                                difficulty: receivedBlockData[i].difficulty,
                                nonce: receivedBlockData[i].nonce
                            });

                            new_block.save().then(data => {
                                console.log("Blockchian Updated");
                            })

                            //remove transaction pool data
                            Transaction_pool.find().then(transacton_pool_data => {

                                const array_transaction_data = Object.entries(receivedBlockData[i].data[1]);
                                for (let i = 0; i < transacton_pool_data.length; i++) {

                                    if (array_transaction_data[0][1] == transacton_pool_data[i].id) {

                                        Transaction_pool.findByIdAndRemove(transacton_pool_data[i]._id)
                                            .then(remove_data => {
                                                if (!remove_data) {
                                                    console.log("Transaction pool not found with id " + transaction_pool_data[i]._id)
                                                    return false;
                                                }
                                            })

                                        break;
                                    }
                                }

                            })
                        }
                    }

                })
            }
        }

        //receive the transaction pool data
        if (message.type == "MessageType.RESPONSE_TRANSACTION_POOL") {
            const receivedTransactions = message.data;
            if (receivedTransactions === null) {
                console.log('invalid transaction received: %s', JSON.stringify(message.data));
            } else {
                //update transaction pool data in user database
                Transaction_pool.find().then(transacton_pool_data => {

                    var in_db_time = 0
                    for (let i = 0; i < receivedTransactions.length; i++) {
                        var in_db = false;
                        //check the receviedTransaction is in db or not
                        for (let j = 0; j < transacton_pool_data.length; j++) {
                            //check role
                            if (transacton_pool_data[j].id == receivedTransactions[i].id) {
                                if ((transacton_pool_data[j].txIns.txOutId == receivedTransactions[i].txIns.txOutId) &&
                                    (transacton_pool_data[j].txIns.txOutIndex == receivedTransactions[i].txIns.txOutIndex) &&
                                    (transacton_pool_data[j].txIns.signature == receivedTransactions[i].txIns.signature)) {
                                    if ((transacton_pool_data[j].txOuts.address == receivedTransactions[i].txOuts.address) &&
                                        (transacton_pool_data[j].txOuts.amount == receivedTransactions[i].txOuts.amount)) {
                                        in_db = true;
                                        in_db_time = in_db_time + 1;
                                    }
                                }
                            }

                        }


                        if (in_db == false) {
                            const transaction_pool = new Transaction_pool({
                                id: receivedTransactions[i].id,
                                txIns: receivedTransactions[i].txIns,
                                txOuts: receivedTransactions[i].txOuts,
                            });

                            transaction_pool.save().then(data => {})
                        }

                    }

                    if (in_db_time == receivedTransactions.length) {
                        console.log("Transaction Pool data already up to date.");
                    } else {
                        console.log("Transaction Pool Updated");
                    }

                })
            }
        }

        if (message.type == "MessageType.QUERY_TRANSACTION_POOL") {
            exports.broadCastTransactionPool();
        }

        if (message.type == "MessageType.QUERY_Blockchain") {
            exports.broadCastBlockchain();
        }


    } else {
        console.log("Message received = " + received_data.data);
    }
};

ws.onclose = function() {
    // websocket is closed.
    console.log("Connection closed...");
};

exports.broadCastBlockchain = function() {
    const responseBlockchain = new Message;

    block.find().then(data => {
        responseBlockchain.type = "MessageType.RESPONSE_BLOCKCHAIN"
        responseBlockchain.data = data;

        broadcast(JSON.stringify(responseBlockchain));

        console.log("Blockchain data is broaded")
    })
}

exports.broadCastTransactionPool = function() {
    const responseTransactionPoolMsg = new Message;

    Transaction_pool.find().then(data => {
        responseTransactionPoolMsg.type = "MessageType.RESPONSE_TRANSACTION_POOL"
        responseTransactionPoolMsg.data = data;

        broadcast(JSON.stringify(responseTransactionPoolMsg));

        console.log("Transaction Pool data is broaded")
    })
}

exports.queryForBlockchainData = function() {
    const queryBlockchainDataMsg = new Message;

    queryBlockchainDataMsg.type = "MessageType.QUERY_Blockchain"
    queryBlockchainDataMsg.data = null;

    broadcast(JSON.stringify(queryBlockchainDataMsg));

    console.log("Query Blockchain Msg is sent")
}

exports.queryForTransactionPoolData = function() {
    const queryTransactionPoolDataMsg = new Message;

    queryTransactionPoolDataMsg.type = "MessageType.QUERY_TRANSACTION_POOL"
    queryTransactionPoolDataMsg.data = null;

    broadcast(JSON.stringify(queryTransactionPoolDataMsg));

    console.log("Query TransactionPool Msg is sent")
}

function broadcast(send_msg) {
    ws.send(send_msg);
}

exports.getP2PList = (req, res) => {
    const user_list = [];

    for (var i = 1; i <= index.length - 1; i++) {
        user_list.push(wsArray[i].name);
    }

    res.send(user_list);
}