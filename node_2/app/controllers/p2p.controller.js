const WebSocket = require('ws');
const WebSocketServer = require('ws').Server;

const url = require('url')
const Config = require('../../config/config.js');
const wallet = require("./wallet.controller.js");

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
    console.log('network port = ' + p2p_port);
    console.log('Connected to blockchain p2p');
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

                    if (block_data > receivedBlockData.length) {
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


    } else {
        console.log("Message received = " + received_data.data);
    }
};

ws.onclose = function() {
    // websocket is closed.
    console.log("Connection closed...");
};

exports.broadCastTransactionPool = (req, res) => {
    const responseTransactionPoolMsg = new Message;
    responseTransactionPoolMsg.type = "MessageType.RESPONSE_TRANSACTION_POOL"

    Transaction_pool.find().then(data => {
        responseTransactionPoolMsg.data = data;

        broadcast(JSON.stringify(responseTransactionPoolMsg));

        res.send("broaded");
    })
}

function broadcast(send_msg) {
    for (var i = 1; i <= index.length - 1; i++) {
        if (i != ws.id) {
            wsArray[i].send(send_msg);
        }
    }
}

exports.getP2PList = (req, res) => {
    const user_list = [];

    for (var i = 1; i <= index.length - 1; i++) {
        user_list.push(wsArray[i].name);
    }

    res.send(user_list);
}