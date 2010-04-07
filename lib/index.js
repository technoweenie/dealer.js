var sys = require('sys'),
    url = require('url'),
     qs = require('querystring'),
     ws = require('ws')

exports.create = function() {
  return new Dealer()
}

// Creates a new Dealer instance with an empty set of channels and ids.  The
// provided server uses the node ws library.
//
// Returns Dealer
function Dealer() {
  var conn      = this
  this.channels = {} // channel => {id: id, subscribers: [id, id]}
  this.ids      = {} // id      => {id: id, socket: socket, channel: channel}
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
}

Dealer.prototype = Object.create(process.EventEmitter.prototype);

// Adds the incoming socket connection to the server list. 
//
// socket   - socket object from the ws.createServer callback.
// resource - path used when connecting to the service.
//
// Returns Client
// Emits connect event with (Client)
Dealer.prototype.connect = function(socket, resource) {
  var client = new Client(socket, resource)
  this.disconnect(this.ids[client.id])
  this.ids[client.id] = client

  var dealer = this
  client.eachChannel(function(name) {
    var channel = dealer.channels[name] || new Channel(name)
    dealer.channels[name] = channel
    channel.subscribers[client.id] = null
  })

  this.emit('connect', client)
  return client
}

// Removes the client from this Dealer's list of clients, and removes the 
// client from the subscribed channel.
//
// client - client object
//
// Returns nothing
// Emits disconnect event with (client)
Dealer.prototype.disconnect = function(client) {
  if(!client) return
  delete this.ids[client.id]

  var dealer = this
  client.eachChannel(function(chan) {
    delete dealer.channels[chan].subscribers[client.id]
  })

  this.emit('disconnect', client)
}

// Sends the given data to the sockets of all the subscribers of the given
// channel.
//
// channelName - String name of the channel
// data        - String data to send
//
// Returns nothing
Dealer.prototype.sendToChannel = function(channelName, data) {
  var channel = this.channels[channelName]
  if(!channel) return
  var subs = Object.keys(channel.subscribers)
  var num  = subs.length
  for(var i = 0; i < num; i++) {
    var client = this.ids[subs[i]]
    client.send(data)
  }
}

// Processes an incoming message from the web socket connection.
//
// sender - Client that sent the data
// data   - received String data
//
// Returns nothing
// Emits receive event with (client, data)
Dealer.prototype.receive = function(sender, data) {
  this.emit('receive', sender, data)
}

// Creates a new Client instance.
//
// socket   - Socket instance from the ws.createServer callback.
// resource - path used when connecting to the service.  Given a 
//            url like ws://localhost/foo, '/foo' is the resource.
//
// Returns Client
function Client(socket, resource) {
  var u         = url.parse(resource)
  var q         = qs.parse(u.query)
  this.id       = q.id
  this.channels = u.pathname.replace(/^\//, '').split('/')
  this.socket   = socket
}

// Sends the given data to the Client's socket.
//
// data - String data to send
//
// Returns nothing
Client.prototype.send = function(data) {
  if(!this.socket || !this.socket.write) return
  this.socket.write(data)
}

// Iterates over each channel, passing the name to a given callback.
//
// callback - Function that takes one String argument of the channel name.
//
// Returns nothing
Client.prototype.eachChannel = function(callback) {
  var chanLength = this.channels.length
  for(var i = 0; i < chanLength; i++) {
    callback(this.channels[i])
  }
}

// Creates a new Channel instance
//
// name - String used to uniquely identify the channel.
//
// Returns Channel
function Channel(name) {
  this.id = name
  this.subscribers = []
}