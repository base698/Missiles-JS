io = require "socket.io"
express = require('express')
app = express.createServer()
engine = require './engine'

oneYear = 1000*60*60*24
app.use(express.static(__dirname, { maxAge: oneYear }))
app.listen 1337
socket = io.listen app

start = (client)->
	engine.setSocket(socket)
	engine.start(client)

socket.on 'connection', (client) ->
	client.on 'message', (m) ->
		if m.action == 'start' then start(client)
		if m.action == 'removeMissile' then engine.removeMissile(m)
		if m.action == 'fire' then engine.fire(client.sessionId,m)
		if m.action == 'name' then engine.name(m)
