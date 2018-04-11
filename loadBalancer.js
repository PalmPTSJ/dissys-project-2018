var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

app.get('/', function(req, res){
    res.send(fs.readFileSync('index.html').toString());
});

http.listen(8080, function(){
    console.log('listening on *:8080');
});

io.on('connection', function(socket){
    socket.on('chat', (gid, msg) => {
      console.log("CHAT",msg);
    });
    
    socket.on('ack', (gid, id) => {
      
    })
});