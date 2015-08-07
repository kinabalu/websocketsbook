var express = require('express');
var http = require('http');
var socketio = require('socket.io');
var uuid = require('node-uuid');

var app = express();
var httpServer = http.createServer(app);
var io = socketio.listen(server);

var clients = [];

function wsSend(type, client_uuid, nickname, message) {
  for(var i=0; i<clients.length; i++) {
    var clientSocket = clients[i].connection;
        clientSocket.emit(type, {
            id: client_uuid,
            nickname: nickname,
            message: message
        });
  }
}


io.sockets.on('connection', function (conn) {
    var client_uuid = uuid.v4();
    var nickname = client_uuid.substr(0, 8);
    clients.push({"id": client_uuid, "connection": conn, "nickname": nickname});
    console.log('client [%s] connected', client_uuid);

    var connect_message = nickname + " has connected";
    wsSend("notification", client_uuid, nickname, connect_message);

    conn.on('message', function (message) {
        wsSend("message", client_uuid, nickname, message);
    });

    conn.on('nickname', function(nick) {
        console.log(nick);
        var old_nickname = nickname;
        nickname = nick.nickname;
        var nickname_message = "Client " + old_nickname + " changed to " + nickname;
        wsSend('nickname', client_uuid, nickname, nickname_message);
    });

    conn.on('disconnect', function() {
        for(var i=0; i<clients.length; i++) {
            if(clients[i].id == client_uuid) {
              var disconnect_message = nickname + " has disconnected";
              wsSend("notification", client_uuid, nickname, disconnect_message);
              clients.splice(i, 1);
            }
        }
    });
});

server.listen(8181);

app.get('/client.html', function (req, res) {
  res.sendfile(__dirname + '/client.html');
});

app.get('/style.css', function (req, res) {
  res.sendfile(__dirname + '/style.css');
});

