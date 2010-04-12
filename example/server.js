var redisClient = require("redisclient"),
         dealer = require("../lib"),
            sys = require('sys'),
            url = require('url')

var port      = process.env['PORT'] || 3840
var redisConf = process.env['REDIS_URL'] || "redis://127.0.0.1:6379/0"

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

redisConf   = url.parse(redisConf)
var redisDb = redisConf.pathname.substr(1)
var redis   = redisClient.createClient(redisConf.port, redisConf.hostname);

redis.stream.addListener("connect", function () {
  redis.select(redisDb, function(a) {
    redis.subscribeTo("*", function (channel, message) {
      sys.puts("to " + channel + ": " + message);
      conn.sendToChannel(channel, message)
    })
  })
})