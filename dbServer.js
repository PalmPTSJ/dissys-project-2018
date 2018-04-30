var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

let port = parseInt(process.argv[2]);

app.get('/', function(req, res){});

http.listen(port, function(){
    console.log('DB server listening on *:'+port);
});

let db = {
    users : {},
    groups : {}
};
/*
DB spec:


db.users.$userId = {joinedGroup:[$group_id]}}

chatMessage : {id:$id, user:$user, timestamp:$timestamp, msg:$msg}

db.groups.$groupId = {chatMessages:[chatMessage], joinedUser:[$username]}
*/

let userId = 0;
io.on('connection', function(socket){
    socket.userId = userId++;
    console.log(`New connection to DB, ID: ${socket.userId}`);
    
    socket.on('createUser', ([username]) => {
        console.log(`[DB] ${socket.userId}: Create user ${username}`);
        db.users.username = {joinedGroup:[]};
    });
    
    socket.on('createGroup', ([username,groupId]) => {
        console.log(`[DB] ${socket.userId}: User ${username} create group ${groupId}`);
        db.groups.groupId = {chatMessages:[], joinedUser:[]};
        db.groups.groupId.joinedUser.push(username);
        db.users.username.joinedGroup.push(groupId);
    });
    
    socket.on('userJoinGroup', ([username, groupId]) => {
        console.log(`[DB] ${socket.userId}: User ${username} join group ${groupId}`);
        db.groups.groupId.joinedUser.push(username);
        db.users.username.joinedGroup.push(groupId);
    });
    
    socket.on('userChat', ([username, groupId, chat]) => {
        console.log(`[DB] ${socket.userId}: User ${username} group ${groupId} chat ${chat}`);
        let msgId = db.groups.groupId.chatMessages.length;
        let chatMessage = {id:msgId, user:username, timestamp:(new Date()).toUTCString()};
        db.group.groupId.chatMessages.push(chatMessage);
    });
    
    socket.on('getGroup', ([username, callback]) => {
        console.log(`[DB] ${socket.userId}: User ${username} group ${groupId} chat ${chat}`);
        callback(db.users.username.joinedGroup);
    });
    
    socket.on('getChat', ([groupId, msgId, callback]) => {
        // Return chat from msgId to last
        console.log(`[DB] ${socket.userId}: group ${groupId} get chat from ${msgId}`);
        if(db.groups.groupId.chatMessages.length <= msgId) {
            callback([]);
        }
        else {
            callback(db.groups.groupId.chatMessages.slice(msgId));
        }
    });
});