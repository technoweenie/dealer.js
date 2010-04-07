var dealer = require("./lib/index"),
       sys = require('sys')

conn = dealer.create()
conn.server.listen(3840)