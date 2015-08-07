var express = require('express');
var http = require('http');
var sockjs = require('sockjs');
var uuid = require('node-uuid');

var app = express();
var httpServer = http.createServer(app);
var sockServer = sockjs.createServer();

var clients = [];

var CONNECTING = 0;
var OPEN = 1;
var CLOSING = 2;
var CLOSED = 3;


function wsSend(type, client_uuid, nickname, message) {
  for(var i=0; i<clients.length; i++) {
    var clientSocket = clients[i].connection;
    if(clientSocket.readyState === OPEN) {
      clientSocket.write(JSON.stringify({
        "type": type,
        "id": client_uuid,
        "nickname": nickname,
        "message": message
      }));
    }
  }
}


sockServer.on('connection', function(conn) {
    var client_uuid = uuid.v4();
    var nickname = client_uuid.substr(0, 8);
    clients.push({"id": client_uuid, "connection": conn, "nickname": nickname});
    console.log('client [%s] connected', client_uuid);

    var connect_message = nickname + " has connected";
    wsSend("notification", client_uuid, nickname, connect_message);

    conn.on('data', function(message) {
        if(message.indexOf('/nick') === 0) {
          var nickname_array = message.split(' ');
          if(nickname_array.length >= 2) {
            var old_nickname = nickname;
            nickname = nickname_array[1];
            var nickname_message = "Client " + old_nickname + " changed to " + nickname;
            wsSend("nick_update", client_uuid, nickname, nickname_message);
          }
        } else {
          wsSend("message", client_uuid, nickname, message);
        }
    });
    conn.on('close', function() {
        for(var i=0; i<clients.length; i++) {
            if(clients[i].id == client_uuid) {
              var disconnect_message = nickname + " has disconnected";
              wsSend("notification", client_uuid, nickname, disconnect_message);
              clients.splice(i, 1);
            }
        }
    });
});

sockServer.installHandlers(httpServer, {prefix:'/chat'});

console.log(' [*] Listening on 0.0.0.0:8181' );
httpServer.listen(8181, '0.0.0.0');

app.get('/client.html', function (req, res) {
    res.sendfile(__dirname + '/client.html');
});

app.get('/style.css', function (req, res) {
    res.sendfile(__dirname + '/style.css');
});