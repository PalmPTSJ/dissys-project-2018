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
    
    socket.on('login', async (data,callback) => {
        console.log(`[SERV] Login as ${data.username}`);
        try {
            let result = await queryPromise(data.requestId,'INSERT INTO user_record(username) VALUES (?);',[data.username]);
            callback({status:"SUCCESS", result:result});
        }
        catch(e) {
            callback({status:"ERROR", result:e});
        }
    });
    
    socket.on('createGroup',async (data, callback) => {
        console.log(`[SERV] User ${data.username} create group ${data.name}`);
        try {
            let result = await queryPromise(data.requestId,'INSERT INTO group_record(group_id) VALUES (?); INSERT INTO user_join_group(username, group_id) VALUES (?, ?);',[data.name,data.username, data.name]);
            callback({status:"SUCCESS", result:result});
        }
        catch(e) {
            callback({status:"ERROR", result:e});
        }
    });
    
    socket.on('joinGroup',async (data, callback) => {
        // data.username    = username
        // data.name        = group name
        console.log(`[SERV] User ${data.username} join group ${data.name}`);
        try {
            let result = await queryPromise(data.requestId,'INSERT INTO user_join_group(username, group_id) VALUES (?, ?);',[data.username, data.name]);
            callback({status:"SUCCESS", result:result});
        }
        catch(e) {
            callback({status:"ERROR", result:e});
        }
    });
    
    socket.on('getAvailableGroup',async (data, callback) => {
        // data.username
        try {
            let result = await queryPromise(data.requestId,'SELECT * FROM group_record G WHERE NOT EXISTS (SELECT * FROM user_join_group WHERE username=? AND group_id=G.group_id) ORDER BY group_id ASC;',data.username);
            callback({status:"SUCCESS", result:result[2]});
        }
        catch(e) {
            console.log(`[SERV] Get available group ${data.username}`);
            callback({status:"ERROR", result:e.sql});
        }
    });
    
    socket.on('getJoinedGroup',async (data, callback) => {
        // data.username    = Username
        //console.log(`[SERV] Get join group`);
        try {
            let result = await queryPromise(data.requestId,'SELECT * FROM user_join_group WHERE username=?;',data.username);
            callback({status:"SUCCESS", result:result[2]});
        }
        catch(e) {
            console.log(`[SERV] ERROR getJoinedGroup ${data.username}`);
            callback({status:"ERROR", result:e.sql});
        }
    });
    
    socket.on('getGroupChat',async (data, callback) => {
        // data.name    = Group name
        // data.ack     = ACKNOWLEDGE
        //console.log(`[SERV] Get group chat ${data.name}, ${data.ack}`);
        try {
            let result = await queryPromise(data.requestId,'SELECT * FROM message_record WHERE group_id=? AND message_id > ? ORDER BY message_id ASC;',[data.name,data.ack]);
            callback({status:"SUCCESS", result:result[2]});
        }
        catch(e) {
            console.log(`[SERV] ERROR getGroupChat ${data.name}, ${data.ack}`);
            callback({status:"ERROR", result:e.sql});
        }
    });
    
    socket.on('leaveGroup',async (data, callback) => {
        // data.name    = Group name
        // data.username = ACKNOWLEDGE
        //console.log(`[SERV] Get group chat ${data.name}, ${data.ack}`);
        try {
            let result = await queryPromise(data.requestId,'DELETE FROM user_join_group WHERE username=? AND group_id=?;',[data.username,data.name]);
            callback({status:"SUCCESS", result:result});
        }
        catch(e) {
            console.log(`[SERV] ERROR getGroupChat ${data.name}, ${data.ack}`);
            callback({status:"ERROR", result:e.sql});
        }
    });
    
    
    socket.on('sendMessage',async (data, callback) => {
        // data.username = Username
        // data.name    = Group name
        // data.message = message
        console.log(`[SERV] User ${data.username} chat to group ${data.name} TEXT ${data.message}`);
        try {
            let result = await queryPromise(data.requestId,'INSERT INTO message_record(group_id,message_text,message_sender) VALUES(?,?,?);',[data.name, data.message, data.username]);
            callback({status:"SUCCESS", result:result[2]});
        }
        catch(e) {
            callback({status:"ERROR", result:e.sql});
        }
    });
    
    socket.on('setPrimaryServer', () => {
        console.log(`[SERV] Set as primary server`);
    });
    
});

function queryPromise(requestId,queryString,queryParams) {
    return new Promise((res,rej) => {
        connectionPool.getConnection(async (err, conn) => {
            if(err) {
                console.log(`[SERV] getConnection error`);
                rej("GET_CONNECTION_ERROR");
                return;
            }
            conn.query(
`START TRANSACTION;
INSERT INTO transaction_record(record_id) VALUES (${requestId});
${queryString}
COMMIT;`,
            queryParams,(err,result,field) => {
                conn.release();
                if(err) {
                    //console.log("SQL Error",err,err.sql);
                    rej(err);
                }
                res(result);
            })
        }); 
    });
}