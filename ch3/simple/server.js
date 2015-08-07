var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server,
    wss = new WebSocketServer({port: 8181,
        verifyClient: function(info, callback) {
          console.log(info.req);
            if(info.origin === 'http://ws.mysticcoders.com') {
                callback(true);
                return;
            }
            callback(false);
        }
    });
var uuid = require('node-uuid');

var clients = [];

wss.on('connection', function(ws) {
  var client_uuid = uuid.v4();
  clients.push({"id": client_uuid, "ws": ws});
  console.log('client [%s] connected', client_uuid);
  ws.on('message', function(message) {
    for(var i=0; i<clients.length; i++) {
        var clientSocket = clients[i].ws;
        if(clientSocket.readyState === WebSocket.OPEN) {
            console.log('client [%s]: %s', clients[i].id, message);
            clientSocket.send(JSON.stringify({
                "id": client_uuid,
                "message": message
            }));
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
