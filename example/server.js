var redisClient = require("redisclient"),
         dealer = require("../lib"),
            sys = require('sys')

var port = process.env['PORT'] || 3840

conn = dealer.create()
conn.server.listen(port)

sys.puts("listening on " + port)

conn.addListener('connect', function(client) {
  sys.puts('connected to ' + sys.inspect(client.channels) + ': '+ client.id)
})

conn.addListener('disconnect', function(client) {
  sys.puts('disconnected: ' + client.id)
})

conn.addListener('receive', function(client, data) {
  sys.puts('from ' + client.id + sys.inspect(client.channels) + ': ' + data)
  client.send("PONG! " + data)
})

var redis = redisClient.createClient();
    
redis.stream.addListener("connect", function () {
  redis.subscribeTo("*", function (channel, message) {
    sys.puts("to " + channel + ": " + message);
    conn.sendToChannel(channel, message)
  })
})