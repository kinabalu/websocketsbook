var crypto = require('crypto');

var SPEC_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

var webSocketAccept = function(secWebsocketKey) {
   var sha1 = crypto.createHash("sha1");
   sha1.update(secWebsocketKey + SPEC_GUID, "ascii");
   return sha1.digest("base64");
}

if(process.argv.length <= 2) {
	console.log("You must provide a Sec-WebSocket-Key as the only parameter");
	process.exit(1);
}

var webSocketKey = process.argv[2];
// VohylhUqv+pM9i19Djqg9g== is jAuSGQMfKgaPekkZzpJmvC8XAV0=
webSocketAccept = webSocketAccept(webSocketKey);
console.log("Sec-WebSocket-Accept:", webSocketAccept);