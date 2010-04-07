var redisClient = require("redisclient"),
         dealer = require("../lib/index"),
            sys = require('sys')

conn = dealer.create()
conn.server.listen(3840)

conn.addListener('connect', function(client) {
  sys.puts('connected to ' + client.channel + ': '+ client.id)
})

conn.addListener('disconnect', function(client) {
  sys.puts('disconnected: ' + client.id)
})

conn.addListener('receive', function(client, data) {
  sys.puts('from ' + client.id + '(' + client.channel + '): ' + data)
  conn.send(client, "PONG! " + data)
})

var redis = redisClient.createClient();
    
redis.stream.addListener("connect", function () {
  redis.subscribeTo("*", function (channel, message) {
    sys.puts("to " + channel + ": " + message);
    conn.sendToChannel(channel, message)
  })
})