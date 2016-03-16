engine = require './engine'
express = require('express')
app = express()
oneYear = 1000*60*60*24
app.use(express.static(__dirname))
server = require('http').createServer(app)
io = require("socket.io").listen(server)
server.listen(1337)

start = (client)->
	engine.setSocket(io)
	engine.start(client)

io.sockets.on 'connection', (client) ->
	client.on 'message', (m) ->
		if m.action == 'start' then start(client)
		if m.action == 'removeMissile' then engine.removeMissile(m)
		if m.action == 'fire' then engine.fire(client.id,m)
		if m.action == 'name' then engine.name(m)






