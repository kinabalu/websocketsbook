var assert = require("assert");
var MockMain = require('../mock-socket/src/main');

beforeEach(function(){
    console.dir(MockMain.globalContext);
    console.log("--whatever--");
    console.dir(assert);
  mockServer = new MockServer("ws://localhost:8181")
    console.log("mockServer", mockServer)

    mockServer.on('connection', function(server) {
      server.on('message', function(data) {
        server.send('hello');
      });
    });  
})

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    })
  })
})