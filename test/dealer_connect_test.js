var dealer = require('../lib'),
    assert = require('assert'),
       sys = require('sys')

var d = dealer.create()

assert.deepEqual({}, d.ids)
assert.deepEqual({}, d.channels)

// connect first client
var expectedEvents   = 5
var expectedClientId = 'abc'
var clientAssertion = function(client) {
  assert.ok(expectedEvents > 0)
  expectedEvents = expectedEvents - 1
  assert.equal(expectedClientId, client.id)
}

d.addListener('connect',    clientAssertion)
d.addListener('disconnect', clientAssertion)

var client = d.connect('a', '/foo?id=abc')
assert.equal('abc',   client.id)
assert.equal('a',     client.socket)
assert.deepEqual(['foo'],     client.channels)
assert.deepEqual([client.id], Object.keys(d.channels.foo.subscribers))
assert.deepEqual(client,      d.ids.abc)

// connect second client
expectedClientId = 'def'
var client2 = d.connect('a', '/foo?id=def')
assert.equal('def',   client2.id)
assert.equal('a',     client2.socket)
assert.deepEqual(['foo'],                 client2.channels)
assert.deepEqual([client.id, client2.id], Object.keys(d.channels.foo.subscribers))
assert.deepEqual(client2,                 d.ids.def)

// same id as client, but different channel
expectedClientId = 'abc'
var client3 = d.connect('b', '/bar/baz?id=abc')
assert.equal('abc',          client3.id)
assert.equal('b',            client3.socket)
assert.deepEqual(['bar', 'baz'], client3.channels)
assert.deepEqual([client3.id],   Object.keys(d.channels.bar.subscribers))
assert.deepEqual(client3,        d.ids.abc)

// check that client3 is removed from foo channel
assert.deepEqual([client2.id], Object.keys(d.channels.foo.subscribers))
assert.deepEqual([client3.id], Object.keys(d.channels.bar.subscribers))
assert.deepEqual([client3.id], Object.keys(d.channels.baz.subscribers))

// disconnect client2
expectedClientId = 'def'
d.disconnect(client2)
assert.equal(null, d.ids[client2.id])
assert.deepEqual([], Object.keys(d.channels.foo.subscribers))

assert.equal(0, expectedEvents)
sys.puts('pass!')