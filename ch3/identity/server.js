var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server,
// var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: 8181});
var uuid = require('node-uuid');

var clients = [];

var clientIndex = 1;

wss.on('connection', function(ws) {
  var client_uuid = uuid.v4();
  var nickname = "AnonymousUser" + clientIndex;
  clientIndex+=1;
  clients.push({"id": client_uuid, "ws": ws, "nickname": nickname});
  console.log('client [%s] connected', client_uuid);
  ws.on('message', function(message) {
    if(message.indexOf('/nick') == 0) {
      var nickname_array = message.split(' ')
      if(nickname_array.length >= 2) {
        var old_nickname = nickname;
        nickname = nickname_array[1];
        for(var i=0; i<clients.length; i++) {
          var clientSocket = clients[i].ws;
          var nickname_message = "Client " + old_nickname + " changed to " + nickname;
          clientSocket.send(JSON.stringify({
            "id": client_uuid,
            "nickname": nickname,
            "message": nickname_message
          }));
        }
      }
    } else {
      for(var i=0; i<clients.length; i++) {
          var clientSocket = clients[i].ws;
          if(clientSocket.readyState === WebSocket.OPEN) {
              console.log('client [%s]: %s', clients[i].id, message);
              clientSocket.send(JSON.stringify({
                  "id": client_uuid,
                  "nickname": nickname,
                  "message": message
              }));
          }
      }
    }
  });

  ws.on('close', function() {
    for(var i=0; i<clients.length; i++) {
        if(clients[i].id == client_uuid) {
            console.log('client [%s] disconnected', client_uuid);
            clients.splice(i, 1);
        }
    }
  });
});
