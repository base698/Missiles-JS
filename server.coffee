io = require "socket.io"
express = require('express')
app = express.createServer()

oneYear = 1000*60*60*24
app.use(express.static(__dirname, { maxAge: oneYear }))
app.listen 1337
socket = io.listen app

socket.on 'connection', (client) ->
	client.on 'message', (m) ->
		console.log 'yo'
