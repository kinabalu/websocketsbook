var fs = require('fs');

// you'll probably load configuration from config
var cfg = {
    ssl: true,
    host: '0.0.0.0',
    port: 8080,
    ssl_key: 'server.key',
    ssl_cert: 'server.crt'
};

var https = require('https');
var http = require('http');
var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var app = null;

// dummy request processing
var processRequest = function( req, res ) {
    res.writeHead(200);
    res.end("Hi!\n");
};

// app = http.createServer(processRequest ).listen(8080, "0.0.0.0");
/*
app = http.createServer({
    key: fs.readFileSync( cfg.ssl_key ),
    cert: fs.readFileSync( cfg.ssl_cert )

}, processRequest ).listen( cfg.port );
*/
fs.readFile('./index.html', function(err, html) {
    if(err) {
        throw err;
    }
    app = https.createServer({
        key: fs.readFileSync( cfg.ssl_key ),
        cert: fs.readFileSync( cfg.ssl_cert )
    }, function(request, response) {
        response.writeHeader(200, {"Content-Type": "text/html"});
        response.write(html);
        response.end();
    }).listen(8081, "0.0.0.0");

    var wss = new WebSocketServer( { server: app } );

    wss.on( 'connection', function ( wsConnect ) {

        wsConnect.on( 'message', function ( message ) {
            console.log( message );
        });

    });    
})

