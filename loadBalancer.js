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

let serverConnection = [];
// connect to server
serversIp.forEach(ip => {
    ip = "ws://"+ip;
    let serverSocket = ioclient(ip);
    serverConnection.push(serverSocket);
    serverSocket.on('connect', (e) => {
        console.log(`[LB] Connection to server ${ip} established`);
        let i = serverConnection.indexOf(serverSocket);
        if(i == 0) {
            serverSocket.emit('setPrimaryServer');
        }
    });
    serverSocket.on('disconnect', () => {
      console.log(`[LB] Server ${serverSocket.ip} disconencted`);
      let i = serverConnection.indexOf(serverSocket);
      serverConnection.splice(i, 1);
      if(i == 0) {
          // Primary server was disconnected
          if(serverConnection.length > 0) {
              serverConnection[0].emit('setPrimaryServer');
          }
      }
   });
});

function forwardRequest(event,data,callback) {
    // if no available server
    if(serverConnection.length === 0) {
        console.log(`[LB] No server available !!!`)
    }
    if(callback !== undefined) {
        serverConnection[0].emit(event,data,callback);
    }
    else {
        serverConnection[0].emit(event,data);
    }
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
    console.log(`[LB] New connection, ID: ${socket.userId}`);
    socket.on('login', ([username]) => {
        console.log(`[LB] ${socket.userId}: Login as ${username}`);
        forwardRequest('login',[username]);
    });
    
    socket.on('createGroup', ([username, groupId]) => {
        console.log(`[LB] ${socket.userId}: User ${username} create group ${groupId}`);
        forwardRequest('createGroup',[username,groupId]);
    });
    
    socket.on('chat', (gid, msg) => {
        console.log("CHAT",msg);
    });
    
    socket.on('ack', (gid, id) => {
      
    })
});