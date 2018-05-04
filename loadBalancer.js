var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ioclient = require('socket.io-client');
var fs = require('fs');

let port = parseInt(process.argv[2]);

let serversIp = process.argv.slice(3);

console.log("Load balancer config:");
console.log("Port: "+port);
console.log("ServerList: ",serversIp,`(Server count = ${serversIp.length})`);

let pendingTransactons = [];

let serverConnection = [];

let nounceList = new Set();
let lastNounceTime = 0;

let primaryServer = null;

function setNewPrimaryServer(socket) {
    console.log(`[LB] New primary server ${socket.serverIP}`);
    primaryServer = socket;
    socket.emit('setPrimaryServer');
    pendingTransactons.forEach(tx => {
        console.log(`[LB] Retransmitting transaction ${tx.requestId} ${JSON.stringify(tx)} `)
        sendTransaction(tx);
    });
}

function sendTransaction(tx) {
    if(primaryServer === null || !primaryServer.connected) {
        console.log(`[LB] No server available ... stored as pending transaction`); 
        return;
    }
    //console.log(`[LB] Sending transaction ${tx.requestId} ${JSON.stringify(tx)} `);
    primaryServer.emit(tx.event,tx,(resp)=> {
        //console.log(`[LB] Received response ${resp}`);
        if(tx.callback !== undefined) tx.callback(resp);
        nounceList.delete(tx.requestId);
        pendingTransactons.splice(pendingTransactons.indexOf(tx),1);
    });
}

function findNewPrimaryServer() {
    serverConnection.forEach(socket => {
        if(socket.connected) {
            if(primaryServer === null) {
                setNewPrimaryServer(socket);
            }
        }
    })
}

// connect to server
serversIp.forEach(ip => {
    ip = "ws://"+ip;
    let serverSocket = ioclient(ip);
    serverConnection.push(serverSocket);
    serverSocket.serverIP = ip;
    serverSocket.on('connect', (e) => {
        console.log(`[LB] Connection to server ${serverSocket.serverIP} established`);
        if(primaryServer === null || !primaryServer.connected) {
            findNewPrimaryServer();
        }
    });
    serverSocket.on('reconnect', (e) => {
        console.log(`[LB] Reconnected to server ${serverSocket.serverIP}`);
        if(primaryServer === null || !primaryServer.connected) {
            findNewPrimaryServer();
        }
    })
    serverSocket.on('disconnect', () => {
      console.log(`[LB] Server ${serverSocket.serverIP} disconencted`);
      if(serverSocket === primaryServer) {
          primaryServer = null;
          console.log(`[LB] Primary server is down`);
          findNewPrimaryServer();
      }
   });
});

function getNounce() {
    let time = (new Date()).getTime();
    if(time != lastNounceTime) {
        nounceList = new Set();
    }
    lastNounceTime = time
    while(true) {
        let candidate = time + '' + parseInt(Math.random()*1000000);
        if(!nounceList.has(candidate)) {
            
            return candidate;
        }
    }
}

function forwardRequest(event,data,callback) {
    let tx = Object.assign(data,{requestId:getNounce(), event: event, callback:callback});
    pendingTransactons.push(tx);
    //console.log(`[LB] Forwarding '${event}' as transaction ${tx.requestId}`);
    sendTransaction(tx);
}

app.get('/', function(req, res){
    res.send(fs.readFileSync('index.html').toString());
});

http.listen(port, function(){
    console.log('listening on *:'+port);
});

let userId = 0;
io.on('connection', function(socket){
    socket.userId = userId++;
    console.log(`[LB] New connection, IP: ${socket.request.connection.remoteAddress}, ID:${socket.userId}`);
    
    socket.on('request',(data,callback) => {
        forwardRequest(data.action,data,callback);
    });
});