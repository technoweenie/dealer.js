var dealer = require('../lib'),
    assert = require('assert'),
       sys = require('sys')

var d = dealer.create()

expectedEvents = 1
expectedData   = 'hello'
expectedClient = {id: 'abc', socket: 'a', channels: ['foo']}

d.addListener('receive', function(client, data) {
  assert.ok(expectedEvents > 0)
  expectedEvents = expectedEvents - 1
  assert.deepEqual(expectedClient, client)
  assert.equal(expectedData, data)
})

var client = d.connect('a', '/foo?id=abc')
d.receive(client, 'hello')

assert.equal(0, expectedEvents)
sys.puts('pass!')