const WebSocket = require('ws');
const WebSocketServer = require('ws').Server;
const url = require('url')
const Config = require('../../config/config.js');
const wallet = require("./wallet.controller.js");

const Message = require("../models/p2p_message.model.js");
const Transaction_pool = require("../models/transaction_pool.model.js")
const block = require('../models/block.model.js');

const p2p_port = Config.p2p_port;

ws_server = new WebSocketServer({ port: p2p_port });

//how many user on the p2p network
const index = ['0'];
// store the message
const wsArray = {};

exports.connecToPeers = (req, res) => {
    const public_key = wallet.getPublicFromWallet_return();
    const ws = new WebSocket("ws://localhost:" + p2p_port + "/" + public_key);

    ws.on('open', () => {
        res.send({ message: "Welcome to my p2p network" })
        console.log(public_key + ' joined the room');
    });

    ws.on('error', () => {
        console.log('connection failed');
    });

}

exports.initP2Pserver = function() {
    ws_server.on('connection', function(ws, req) {
        //get the user name
        const location = url.parse(req.url);
        const name = location.path.substring(1);

        //ws.send(name + ' Hello!');

        //output who join the network
        const time = new Date();
        for (var i = 1; i <= index.length - 1; i++) {
            if (i != ws.id) {
                wsArray[i].send(name + ' joined the room at: ' + time.toLocaleDateString());
                console.log(name + ' joined the room at: ' + time.toLocaleDateString());
            }
        }

        for (var i = 0; i <= index.length; i++) {
            if (!index[i]) {
                index[i] = i; //the number of user
                ws.id = i;
                ws.name = name;
                wsArray[ws.id] = ws;
                break;
            }
        }

        initMessageHandler(ws);

        ws.on('close', function() {
            for (var i = 1; i <= index.length - 1; i++) {
                if (i != ws.id) {
                    wsArray[i].send(ws.name + ' is disconnected!')
                    console.log(ws.name + ' is disconnected!')
                }
            }
        })
    })
}

function initMessageHandler(ws) {
    ws.on('message', function(data) {
        try {
            // const message = JSON.parse(data);
            message = data
            if (message === null) {
                console.log('could not parse received JSON message: ' + data);
                return;
            }

            console.log('Received message: %s', message);

            // message between uesr
            for (var i = 1; i <= index.length - 1; i++) {
                if (i != ws.id) {
                    wsArray[i].send(ws.name + ':' + message);
                }
            }

            if (typeof message.type !== 'undefined') {
                switch (message.type) {
                    //receive the transaction pool data
                    case MessageType.RESPONSE_TRANSACTION_POOL:
                        const receivedTransactions = message.data;
                        if (receivedTransactions === null) {
                            console.log('invalid transaction received: %s', JSON.stringify(message.data));
                            break;
                        }

                        //console.log(receivedTransactions);
                }
            }
        } catch (e) {
            console.log(e);
        }
    })
}

exports.broadCastBlockchain = (req, res) => {
    const responseBlockchain = new Message;
    block.find().then(data => {
        responseBlockchain.type = "MessageType.RESPONSE_BLOCKCHAIN"
        responseBlockchain.data = data;

        broadcast(JSON.stringify(responseBlockchain));

        res.send("broadCastBlockchain broaded");
    })

}

exports.broadCastTransactionPool = (req, res) => {
    const responseTransactionPoolMsg = new Message;
    Transaction_pool.find().then(data => {
        responseTransactionPoolMsg.type = "MessageType.RESPONSE_TRANSACTION_POOL"
        responseTransactionPoolMsg.data = data;

        broadcast(JSON.stringify(responseTransactionPoolMsg));

        res.send("broadCastTransactionPool broaded");
    })

}

function broadcast(send_msg) {
    for (var i = 1; i <= index.length - 1; i++) {
        if (i != ws_server.id) {
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