var express = require('express');
var app = express.createServer();
var io = new require('socket.io').listen(app);

var oneyear = 1000*60*60*24;
app.use(express.static(__dirname, { maxage: oneyear }));
app.listen(1337);

var gameEngine = new require('./engine.js').instance();

gameEngine.setClientInterface(function(type,msg){
	io.sockets.emit(type,msg);
});

io.sockets.on('connection',function(client) {
	client.on('message',function(msg) {
		gameEngine.onMessage(client.id,'message',msg);
	});
	
});