io = require "socket.io"
http = require "http"

server = http.createServer (req,res) ->
	res.end('')
server.listen 1337

socket = io.listen server

socket.on 'connection', (client) ->
	client.on 'message', (m) ->
		console.log 'yo'
