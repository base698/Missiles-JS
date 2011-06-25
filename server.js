var express = require('express');
var app = express.createServer();
var io = require('socket.io').listen(app);
var gameEngine = new require('./engine.js').instance();

var oneYear = 1000*60*60*24;
app.use(express.static(__dirname, { maxAge: oneYear }));
app.listen(1337);
gameEngine.setClientInterface(function(type,msg) {
	io.sockets.emit(type,msg);
});

io.sockets.on('connection',function(client) {
	client.on('message',function(msg) {
	  if(msg.action == 'start') gameEngine.start({id:client.id});
	  if(msg.action == 'removeMissile') {
	  	gameEngine.removeMissile(msg);
	  }
	  if(msg.action == 'fire') gameEngine.fire(client.id,msg);
	  if(msg.action == 'name') gameEngine.name(msg);
	});
});
