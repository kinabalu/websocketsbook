var WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({port: 8181, handleProtocols: function(protocol, cb) {
    var v10_stomp = protocol[protocol.indexOf("v10.stomp")];
    if(v10_stomp) {
        cb(true, v10_stomp);
        return;
    }
    cb(false);
}}),
uuid = require('node-uuid'),
amqp = require('amqp'),
Stomp = require('./stomp_helper.js');
var workq = 'stocks.work';
var resultq = 'stocks.result';


var stocks = {
};

var connected_sessions = [];

var connection = amqp.createConnection({
    host: 'localhost',
    login: 'websockets',
    password: 'rabbitmq'
});

connection.on('ready', function() {
    connection.queue('stocks.result', {autoDelete: false, durable: true}, function(q) {
        q.subscribe(function(message) {
            var data;
            try {
                data = JSON.parse(message.data.toString('utf8'));
            } catch(err) {
                console.log(err);
            }
            for(var i=0; i<data.length; i++) {
                for(var client in stocks) {
                    if(stocks.hasOwnProperty(client)) {
                        var ws = stocks[client].ws;
                        for(var symbol in stocks[client]) {
                            if(stocks[client].hasOwnProperty(symbol) && symbol === data[i]['symbol']) {
                                stocks[client][symbol] = data[i]['price'];
                                var price = parseFloat(stocks[client][symbol]);
                                Stomp.send_frame(ws, {
                                    "command": "MESSAGE",
                                    "headers": {
                                        "destination": "/queue/stocks." + symbol
                                    },
                                    content: JSON.stringify({price: price})
                                });
                            }
                        }
                    }
                }
            }
        });
    });
});

var updater = setInterval(function() {

    var st = [];
    for(var client in stocks) {
        for(var symbol in stocks[client]) {
            if(symbol !== 'ws') {
                st.push(symbol);
            }
        }
    }
    if(st.length>0) {
        connection.publish('stocks.work',
            JSON.stringify({"stocks": st}),
            {deliveryMode: 2});
    }
}, 10000);

wss.on('connection', function(ws) {
    console.log('CONNECT received');
    var sessionid = uuid.v4();

    stocks[sessionid] = {};
    connected_sessions.push(ws);
    stocks[sessionid]['ws'] = ws;

    ws.on('message', function(message) {
        var frame = Stomp.process_frame(message);
        var headers = frame['headers'];
        switch(frame['command']) {
            case "CONNECT":
                console.log("Command received: CONNECT");

                Stomp.send_frame(ws, {
                    command: "CONNECTED",
                    headers: {
                        session: sessionid
                    },
                    content: ""
                });
                break;
            case "SUBSCRIBE":
                var subscribeSymbol = symbolFromDestination(
                                        frame['headers']['destination']);
                stocks[sessionid][subscribeSymbol] = 0;
                break;
            case "UNSUBSCRIBE":
                var unsubscribeSymbol = symbolFromDestination(
                                        frame['headers']['destination']);
                delete stocks[sessionid][unsubscribeSymbol];
                break;
            case "DISCONNECT":
                console.log("Disconnecting");
                closeSocket();
                break;
            default:
                Stomp.send_error(ws, "No valid command frame");
                break;
        }
    });

    var symbolFromDestination = function(destination) {
        return destination.substring(destination.indexOf('.') + 1,
                                        destination.length);
    };

    var closeSocket = function() {
        ws.close();
        if(stocks[sessionid] && stocks[sessionid]['ws']) {
            stocks[sessionid]['ws'] = null;
        }
        delete stocks[sessionid];
      };

    ws.on('close', function() {
        closeSocket();
    });

    process.on('SIGINT', function() {
        console.log("Closing via break");
        closeSocket();
        process.exit();
    });


});
