var dealer = require('../lib'),
    assert = require('assert'),
       sys = require('sys')

var d = dealer.create()

function fakeSocket(data, calls) { 
  this.expectedCalls = calls || 1
  this.expectedData  = data
}

fakeSocket.prototype.write = function(data) {
  if(!this.expectedCalls)
    this.expectedCalls = 1
  assert.ok(this.expectedCalls > 0)
  this.expectedCalls = this.expectedCalls - 1

  assert.equal(this.expectedData, data)
  this.expectedData = null
}

// send a single message to a single client
var client = d.connect(new fakeSocket('test'), '/foo?id=abc')

client.send('test')
assert.equal(0,    client.socket.expectedCalls)
assert.equal(null, client.socket.expectedData)

// send a single message to all subscribers of a channel
data = 'group hug'
client.socket.expectedCalls = 1
client.socket.expectedData  = data

client2 = d.connect(new fakeSocket(data), '/foo?id=def')
client3 = d.connect(new fakeSocket(data), '/foo?id=ghi')

d.sendToChannel('foo', data)

assert.equal(0,    client.socket.expectedCalls)
assert.equal(null, client.socket.expectedData)
assert.equal(0,    client2.socket.expectedCalls)
assert.equal(null, client2.socket.expectedData)
assert.equal(0,    client3.socket.expectedCalls)
assert.equal(null, client3.socket.expectedData)

sys.puts('pass!')