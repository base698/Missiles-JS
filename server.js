var express = require('express');
var app = express.createServer();

var oneyear = 1000*60*60*24;
app.use(express.static(__dirname, { maxage: oneyear }));
app.listen(1337);

