// Coordinates for the base
var BOARD_HEIGHT = 500;
var BOARD_WIDTH = 700;
var commandxy = [[650,BOARD_HEIGHT],[350,BOARD_HEIGHT],[550,BOARD_HEIGHT],[200,BOARD_HEIGHT]];
var SPLASH_RADIUS = 20;
var ATTACK_SPEED = 6500;
var LEVEL_CHANGE = 0.95;
var MISSILE_FREQUENCY = 3000;
var TARGET_RANGE = BOARD_WIDTH;
var MISSILE_PER_LEVEL = 10;
var SCORE_PER_MISSILE = 100;
var missilesInFlight = {};
var score = 0;
var level = 1;
var shots = 0;
var hitsThisLevel = 0;
var attackInterval;

var Missle = {};
var clients = {};

// on level up adjust the missile frequency
function levelUp() {
  clearInterval(attackInterval);
  MISSILE_FREQUENCY = Math.floor(MISSILE_FREQUENCY * LEVEL_CHANGE);
  ATTACK_SPEED = Math.floor(ATTACK_SPEED * LEVEL_CHANGE);
  MISSILE_PER_LEVEL = MISSILE_PER_LEVEL * 1.05;
  SCORE_PER_MISSILE = SCORE_PER_MISSILE * 1.05;
  // XXX Increase target precision as well.
  attackInterval = setInterval(function(){doAttack();},MISSILE_FREQUENCY);
  level++;
  socket.sockets.emit('message',{action: 'level',level:level});
}


function fire(from,loc) {
   var c = clients[from]; 
	if(c && !c.player.dead && c.player.missileCount < 2) {

      c.player.missileCount++

	var mDist = dist(c.player.commandxy,[loc.x,loc.y]);
      
	// set the time in air of the missile based
	// on how far it will go.
	var missileTimeInAir = Math.floor(2000 * (mDist/BOARD_HEIGHT));
   setTimeout(function() {
    // detect hit 
	detectHit(c,loc.x,loc.y,SPLASH_RADIUS);
  	c.player.missileCount--;
   },missileTimeInAir);
    
	var path = "M" + c.player.commandxy[0] + " " + c.player.commandxy[1] + "L"+ loc.x + " " + loc.y;
	
	socket.sockets.emit('message',{action:'drawFire',fireX:loc.x,fireY:loc.y,SPLASH_RADIUS:SPLASH_RADIUS,baseX:c.player.commandxy[0],baseY:c.player.commandxy[1],time:missileTimeInAir,path:path});
    c.player.shots++;
   }

}

var missileId = 0;
function getId() {
   return missileId++;
}

// this fires one missile from a random point to a random point
function doAttack() {
	var randomTop = Math.floor(Math.random()*BOARD_WIDTH);
	var randomBottom = Math.floor(Math.random()*BOARD_WIDTH);
	var startMissile = {SPLASH_RADIUS:SPLASH_RADIUS,id:getId(),action:'missile',ATTACK_SPEED:ATTACK_SPEED,t:randomTop,b:randomBottom};
	startMissile.startPt = [randomTop,2];
	startMissile.endPt = [randomBottom,BOARD_HEIGHT];
	
	var missileId = startMissile.id;
	missilesInFlight[missileId] = startMissile;
	startMissile.created = (new Date()).getTime();
    startMissile.destroyed = false;	
    setTimeout(function() {
    // detect hit 
	if(!startMissile.destroyed) 
		detectBaseHit(randomBottom,BOARD_HEIGHT,SPLASH_RADIUS);
	delete missilesInFlight[missileId];
    },ATTACK_SPEED);
 
	socket.sockets.emit('message',startMissile);
}

// distance function between 2 points
function dist(pt1,pt2) {
    var term1 = (pt1[1]-pt2[1]);
    term1 = Math.pow(term1,2);
    term2 = (pt1[0]-pt2[0]);
    term2 = Math.pow(term2,2);
    return Math.sqrt((term2 + term1));

}

// did we get pwn'd?
function detectBaseHit(x,y,r) {
	for(var k in clients) {
		var command = clients[k].player.commandxy;
   		var baseHit = ptWithin([x,y],command,r);
		if(baseHit) {
			endGame(clients[k]);
   		}

	}
}

// if so end game
function endGame(client) {
	// XXX if clients.size is 0 reset defaults
    // stopInterval(attackInterval);
	client.player.dead = true;
	socket.sockets.emit('message',{action:'dead',players:players});
	
}

function detectHit(client,x,y,r) {
    for(var i in missilesInFlight) {
       var m = missilesInFlight[i];
       if(m === null) continue;

       var now = (new Date()).getTime();
       var elapsed = now - m.created;
       var percent = elapsed/ATTACK_SPEED;

       var pt1 = m.startPt;
       var pt2 = m.endPt;
       var currentEndPoint = endPointOfPercentLength(pt1,pt2,percent);
       var within = ptWithin(currentEndPoint,[x,y],r);

       if(within) {
          hitsThisLevel++;
          client.player.score += Math.floor(SCORE_PER_MISSILE);
          socket.sockets.emit('message',{action:'score',missile:m,players:players});
		  missilesInFlight[i].destroyed = true;
       }
    }
    // level up condition
    if(hitsThisLevel >=  MISSILE_PER_LEVEL) {
       hitsThisLevel = 0;
       levelUp();
    }
}


// for 2 points and a percent, calculate the point on the 
// line representing percent past start point 
function endPointOfPercentLength(pt1,pt2,percent) {
   var rise = (pt2[1]-pt1[1]);
   var run = (pt2[0]-pt1[0]);
   var ptDist = dist(pt1,pt2);
   var perDist = ptDist * percent;
   var m = rise/run;
   var pm = m * percent;
   return [pt2[0]-(run*(1-percent)),pt2[1]-(rise*(1-percent))];
}

// detect if ptAt is within circle
function ptWithin(ptAt,originPt,r) {
   var distance = dist(ptAt,originPt);
   return distance <= r;
}

function getCommand() {
    if(commandxy.length == 0) 
	 return false;
	else 
	 return commandxy.pop();
}

var players = [];
var socket;

var engine = module.exports = {
	start: function(client) {
	var id = client.id;
	if(attackInterval == undefined) {
		attackInterval = setInterval( function() { doAttack(); } ,3000 );
	} 
	if(!clients[id]) {
		client.player = {};	
		client.player.commandxy = getCommand();
		if(!client.player.commandxy) {
			client.emit('message',{action:'max'});
			return;
		}
	    // XXX add not playing message	
		if(this.activeBase) {
			this.activeBase.id = client.commandxy;
		} else {
		    this.activeBase = {};
			this.activeBase[id] = client.commandxy;
		}
		client.player.score = 0;
		client.player.missileCount = 0;
		client.player.shots = 0;
		client.player.id = id;
		client.player.name = 'Player ' + players.length;
		clients[id] = client;	
		players.push(client.player);
		socket.sockets.emit('message',{action:'drawBase',id:id,players:players});
	} else {
		client.emit('message',{action:'playing'});
	}
   },
   fire: fire,
   name: function(m) {
		clients[m.id].player.name = m.name;	
   },
   removeMissile: function(m) {
		console.log('removeMissile');
   },
   setSocket: function(s) {
		socket = s;
   }
}
