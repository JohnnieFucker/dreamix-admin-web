const MqttCon = require('mqtt-connection');
const websocket = require('websocket-stream');
const protcol = require('./protocol');
const WebSocketServer = require('ws').Server;
const AdminClient = require('./client');
const config = require('./../config/config.json');

let client = null;

function connectToMaster(id, opts) {
    client = new AdminClient({ username: opts.username, password: opts.password, md5: opts.md5 });
    client.connect(id, opts.host, opts.port, (err) => {
        if (err) {
            client = null;
            console.error(err);
            process.exit(1);
        }
    });
    client.on('error', () => {
        client = null;
    });
    client.on('close', () => {
        client = null;
    });
    client.on('disconnect', () => {
        client = null;
    });
}

function sendRequestToMaster(msg, topic, socket) {
    const moduleId = msg.moduleId;
    const body = msg.body;
    // let command = body.command;
    // if (command) {
    //     command = { command: command };
    // }
    client.request(moduleId, body, (err, data) => {
        if (data) {
            const payload = protcol.composeResponse(msg, err, data);
            if (payload) {
                socket.publish({
                    topic: topic,
                    payload: payload
                });
            }
        } else {
            console.info(msg);
        }
    });
}

const socketServer = {};
socketServer.start = (socketPort) => {
    const wss = new WebSocketServer({ port: socketPort });
    console.log(`[socket server] start on ${socketPort}`);
    wss.on('connection', (ws) => {
        const stream = websocket(ws);
        const socket = MqttCon(stream);
        socket.on('connect', () => {
            socket.connack({
                returnCode: 0
            });
        });

        socket.on('publish', (pkg) => {
            const topic = pkg.topic;
            let msg = pkg.payload.toString();
            msg = JSON.parse(msg);
            msg = protcol.parse(msg);
            if (topic === 'register') {
                msg.host = config.adminHost;
                msg.port = config.adminPort;
                connectToMaster(msg.id, msg);
            } else {
                if (client === null) {
                    socket.removeAllListeners();
                    socket.disconnect();
                    socket.destroy();
                    return;
                }
                sendRequestToMaster(msg, topic, socket);
            }
        });

        socket.on('pingreq', () => {
            socket.pingresp();
        });
    });
};


module.exports = socketServer;
