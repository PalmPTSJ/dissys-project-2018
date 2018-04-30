var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ioclient = require('socket.io-client');
var fs = require('fs');

let port = parseInt(process.argv[2]);
let dbServerIp = 'ws://'+process.argv[3].trim();
app.get('/', function(req, res){});

http.listen(port, function(){
    console.log('listening on *:'+port);
});

console.log("Server config:");
console.log("Port: "+port);
console.log("DB Server: ",dbServerIp);

let db = ioclient(dbServerIp);

db.on('connect', () => {
    console.log(`[SV] Connect to DB server successfully`);
});

let userId = 0;
io.on('connection', function(socket){
    socket.userId = userId++;
    console.log(`New connection to server`);
    
    socket.on('login', ([username]) => {
        console.log(`[SERV] Login as ${username}`);
        db.emit('createUser',[username]);
    });
    
    socket.on('createGroup', ([username, groupId]) => {
        console.log(`[SERV] ${username} create group ${groupId}`);
        db.emit('createGroup',[username,groupId]);
    });
    
    socket.on('setPrimaryServer', () => {
        console.log(`[SERV] Set as primary server`);
    });
    
    socket.on('chat', (gid, msg) => {
        console.log("CHAT",msg);
    });
    
    socket.on('ack', (gid, id) => {
      
    })
});