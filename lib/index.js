var sys = require('sys'),
    url = require('url'),
     qs = require('querystring'),
     ws = require('ws')

function Dealer() {
  var conn = this
  this.server = ws.createServer(function (socket) {
    var client
    socket.addListener("connect", function (res) {
      client = conn.connect(socket, res)
    })
    socket.addListener("data", function (data) {
      if(data == 'Heartbeat') return;
      conn.receive(client, data)
    })
    socket.addListener("close", function () {
      conn.disconnect(client)
    })
  })
  this.channels = {} // channel => {id: id, subscribers: [id, id]}
  this.ids      = {} // id      => {id: id, socket: socket, channel: channel}
}

exports.create = function() {
  return new Dealer()
}

Dealer.prototype = Object.create(process.EventEmitter.prototype);
Dealer.prototype.connect = function(socket, resource) {
  var u        = url.parse(resource)
  var q        = qs.parse(u.query)
  this.disconnect(this.ids[q.id])
  var client   = this.ids[q.id] = {id: q.id, channel: u.pathname.replace(/^\//, ''), socket: socket}
  var channel  = this.channels[client.channel] || {id: client.channel, subscribers: {}}
  this.channels[client.channel]  = channel
  channel.subscribers[client.id] = null
  this.emit('connect', client)
  return client
}

Dealer.prototype.disconnect = function(client) {
  if(!client) return
  delete this.ids[client.id]
  delete this.channels[client.channel].subscribers[client.id]
  this.emit('disconnect', client)
}

Dealer.prototype.receive = function(client, data) {
  this.emit('receive', client, data)
}