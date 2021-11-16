const WebSocket = require('ws');
const WebSocketServer = require('ws').Server;
const url = require('url')
const Config = require('../../config/config.js');

const p2p_port = Config.p2p_port;

ws_server = new WebSocketServer({ port: p2p_port });

//how many user on the p2p network
const index = ['0'];
// store the message
const wsArray = {};

exports.connecToPeers = (req, res) => {
    const ws = new WebSocket("ws://localhost:" + p2p_port + "/" + req.body.peer);

    ws.on('open', () => {
        res.send({ message: "Welcome to my p2p network" })
        console.log(req.body.peer + ' joined the room');
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

        ws.send(name + ' Hello!');

        //output who join the network
        const time = new Date();
        for (var i = 1; i <= index.length - 1; i++) {
            if (i != ws.id) {
                wsArray[i].send(name + ' joined the room at: ' + time.toLocaleDateString());
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

        //message between uesr
        ws.on('message', function(mes) {
            for (var i = 1; i <= index.length - 1; i++) {
                if (i != ws.id) {
                    wsArray[i].send(ws.name + ':' + mes);
                }
            }
        })

        ws.on('close', function() {
            for (var i = 1; i <= index.length - 1; i++) {
                if (i != ws.id) {
                    wsArray[i].send(ws.name + ' is disconnected!')
                }
            }
        })
    })
}

exports.getP2PList = (req, res) => {
    const user_list = [];

    for (var i = 1; i <= index.length - 1; i++) {
        user_list.push(wsArray[i].name);
    }

    res.send(user_list);
}