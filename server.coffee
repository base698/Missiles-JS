io = require "socket.io"
express = require('express')
app = express.createServer()
engine = require './engine'

oneYear = 1000*60*60*24
app.use(express.static(__dirname, { maxAge: oneYear }))
io = io.listen app
app.listen 1337

start = (client)->
	engine.setSocket(io)
	engine.start(client)

io.sockets.on 'connection', (client) ->
	client.on 'message', (m) ->
		if m.action == 'start' then start(client)
		if m.action == 'removeMissile' then engine.removeMissile(m)
		if m.action == 'fire' then engine.fire(client.sessionId,m)
		if m.action == 'name' then engine.name(m)
