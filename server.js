var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ioclient = require('socket.io-client');
var fs = require('fs');

var config = require('./config.js');

let port = parseInt(process.argv[2]);
let dbServerIp = process.argv[3].trim();
app.get('/', function(req, res){});

http.listen(port, function(){
    console.log('listening on *:'+port);
});

console.log("Server config:");
console.log("Port: "+port);
console.log("DB Server: ",dbServerIp);

var mysql      = require('mysql');
var connectionPool = mysql.createPool({
    connectionLimit : 5,
    host     : 'localhost',
    user     : config.db.user,
    password : config.db.pass,
    database : 'dissys',
    multipleStatements: true
});

let userId = 0;
io.on('connection', function(socket){
    socket.userId = userId++;
    console.log(`New connection to server`);
    
    socket.on('login', (data,callback) => {
        console.log(`[SERV] Login as ${data.username}`);
        connectionPool.getConnection(async (err, conn) => {
            if(err) {
                console.log(`[SERV] getConnection error`);
                return;
            }
            try {
                let result = await queryPromise(conn,data.requestId,'INSERT INTO user_record VALUES (?);',[data.username]);
                console.log(`[SERV] Success ${result}`);
                callback({status:"SUCCESS",result:result});
            }
            catch(e) {
                console.log(`[SERV] Error ${e.sql}`);
                callback({status:"ERROR",result:e});
            }
        });
    });
    
    socket.on('createGroup', ([username, groupId]) => {
        console.log(`[SERV] ${username} create group ${groupId}`);
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

function queryPromise(conn,requestId,queryString,queryParams) {
    return new Promise((res,rej) => {
        conn.query(
`START TRANSACTION;
#INSERT INTO transaction_record(record_id) VALUES (${requestId});
${queryString}
COMMIT;`,queryParams,(err,result,field) => {
            if(err) rej(err);
            res(result);
        })
        
    });
}