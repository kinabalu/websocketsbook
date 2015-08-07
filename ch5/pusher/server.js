var express = require('express');
var http = require('http');
var Pusher = require('pusher');
var uuid = require('node-uuid');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());

var httpServer = http.createServer(app);

var pusher = new Pusher({
  appId: '49929',
  key: '1767b3a900a9608560b1',
  secret: '42ec2fdb010a979de7f0'
});

var clients = {};
var clientIndex = 1;

function sendMessage(type, client_uuid, nickname, message) {
    pusher.trigger('chat', type, {
      "id": client_uuid,
      "nickname": nickname,
      "message": message
    });
}

app.post("/nickname", function(req, res) {
    var old_nick = clients[req.body.id].nickname;

    var nickname = req.body.nickname;
    clients[req.body.id].nickname = nickname;

    sendMessage('nickname', 
                req.body.id,
                nickname,
                old_nick + " changed nickname to " + nickname);

    res.status(200).send('');
});

app.post("/login", function(req, res) {
    var client_uuid = uuid.v4();    
    var nickname = "AnonymousUser" + clientIndex;
    clientIndex+=1;    

    clients[client_uuid] = {
        'id': client_uuid,
        'nickname': nickname
    };

    res.status(200).send(
        JSON.stringify(clients[client_uuid])
    );
});

app.post("/chat", function(req, res) {
    sendMessage('message', 
                req.body.id,
                clients[req.body.id].nickname,
                req.body.message);

    res.status(200).send('');
});


app.listen(8181);

app.get('/client.html', function (req, res) {
  res.sendfile(__dirname + '/client.html');
});
