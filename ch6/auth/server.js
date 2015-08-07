var fs = require('fs');

var https = require('https');
var cookie = require('cookie');
var bodyParser = require('body-parser');
var express = require('express');

var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;

var credentials = {
    key: fs.readFileSync('server.key', 'utf8'),
    cert: fs.readFileSync('server.crt', 'utf8')};

var app = express();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

var httpsServer = https.createServer(credentials, app);
httpsServer.listen(8443);

app.get('/login', function (req, res) {
    fs.readFile('./login.html', function(err, html) {
        if(err) {
            throw err;
        }
        res.writeHeader(200, {"Content-Type": "text/html"});
        res.write(html);
        res.end();
    });
});


app.post("/login", function(req, res) {
    if(req.body !== 'undefined') { 
        key = validateLogin(req.body['username'], req.body['password']);
        if(key) {
            res.cookie('credentials', key);
            res.redirect('/secured');
            return;            
        }
    }
    res.sendStatus(401);
});


var validateLogin = function(username, password) {
    if(username == 'test' && password == 'test') {
        return '591a86e4-5d9d-4bc6-8b3e-6447cd671190';
    } else {
        return null;
    }
}

app.get('/secured', function(req, res) {
    cookies = cookie.parse(req.headers['cookie']);
    if(!cookies.hasOwnProperty('credentials') 
            && cookies['credentials'] !== '591a86e4-5d9d-4bc6-8b3e-6447cd671190') {
        res.redirect('/login');
    } else {
        fs.readFile('./secured.html', function(err, html) {
            if(err) {
                throw err;
            }
            res.writeHeader(200, {"Content-Type": "text/html"});
            res.write(html);
            res.end();
        });
    }
});

/**
 * Shim for a check auth method which should go
 * out to some shared database to check that the
 * key being passed in cookie is valid
 * 
 * @param  {[type]} key [description]
 * @return {[type]}     [description]
 */
var checkAuth = function(key) {
    return key === '591a86e4-5d9d-4bc6-8b3e-6447cd671190';
}

var wss = new WebSocketServer({
    server: httpsServer,
    verifyClient: function(info, callback) {
        if(info.secure !== true) {
            callback(false);
            return;
        }
        var parsed_cookie = cookie.parse(info.req.headers['cookie']);

        if('credentials' in parsed_cookie) {
            if(checkAuth(parsed_cookie['credentials'])) {
                callback(true);
                return;
            }
        }
        callback(false);        
    }

});
wss.on('connection', function( wsConnect ) {
    wsConnect.on('message', function(message) {
        console.log(message);
    });
});