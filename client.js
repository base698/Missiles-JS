var socket = new io.Socket();
var BOARD_HEIGHT = 500;
var BOARD_WIDTH = 700;
var paper;

function onMessage(m) {
	if(m.action == 'missile') {
		drawAttack(paper,m);
	} else if(m.action == 'drawBase') {
		drawBases(m.players);	
		drawScores(m.players);
	} else if(m.action == 'drawFire') {
		drawFire(m.path,m.time,m.baseX,m.baseY,m.fireX,m.fireY,m.SPLASH_RADIUS);
	} else if(m.action == 'score') {
		console.log(m);
		// update all scores with players
		drawScores(m.players);
		removeMissile(missilesInFlight[m.missile.id]);

	}
}

function drawScores(players) {
 for(var i=0;i<players.length;i++) {
   $('.stats').html('<h3>Scores</h3>');
   $('.stats').append('<div id="'+players[i].id+'">'+players[i].name+': '+ players[i].score + '</div>');
 }
}

function drawBases(players) {
    for(var i=0;i<players.length;i++) {
		console.log(players[i]);
		var player = players[i];
		var commandxy = player.commandxy;
		var id = player.id;
		// Creates circle (base) at x, y, with radius 10
  		var base = paper.circle(commandxy[0], commandxy[1], 10);
		// Sets the fill attribute of the circle to red (#f00)
  		base.attr("fill", "#f0f");

  		// Sets the stroke attribute of the circle to white
  		base.attr("stroke", "#000");

	}
}

var start = function () {
  	paper = Raphael("canvas",BOARD_WIDTH,BOARD_HEIGHT);
	socket.connect();  
	socket.on('message',onMessage);

  	$("#canvas").click( fire );

  	$("#play").click( startGame );
  	// This starts the flood of missiles.

};

function startGame() {
	console.log('start');
	socket.send({action:"start"});
}

// on level up adjust the missile frequency
function levelUp() {
  clearInterval(attackInterval);
  MISSILE_FREQUENCY = Math.floor(MISSILE_FREQUENCY * LEVEL_CHANGE);
  ATTACK_SPEED = Math.floor(ATTACK_SPEED * LEVEL_CHANGE);
  MISSILE_PER_LEVEL = MISSILE_PER_LEVEL * 1.05;
  SCORE_PER_MISSILE = SCORE_PER_MISSILE * 1.05;
  // XXX Increase target precision as well.
  attackInterval = setInterval(function(){doAttack(paper);},MISSILE_FREQUENCY);
  level++;
  $("#level").text("Level: " + level);
}

var missileCount = 0;
function fire(e) {
     // this works in Chrome
     var fireX = e.offsetX;
     var fireY = e.offsetY;

     // this works in firefox
     if(!fireX) {
        fireX = e.pageX-e.currentTarget.offsetLeft;
        fireY = e.pageY-e.currentTarget.offsetTop;
      }

	socket.send({action:'fire',x:fireX,y:fireY});
}

function drawFire(path,time,baseX,baseY,fireX,fireY,SPLASH_RADIUS) {
     var startMissile = paper.path("M " + baseX + " " + baseY );  
     startMissile.attr("width","3").animate(
      {
         path:path 
       },   
       time, 
       function() { 
          doBoom(fireX,fireY,SPLASH_RADIUS); 
          startMissile.animate({opacity:0},1600,function(){startMissile.remove();});
      });
	   
}

// do the explosion animation for your attack
function doBoom(x,y,SPLASH_RADIUS) {
   var boom = paper.circle(x,y,1).attr("fill","#f00");
   boom.animate({r: SPLASH_RADIUS},500,
      function(){
           boom.animate({opacity: 0},400,function(){boom.remove();});
      });
}

// do explosion animation for enemy attack
function doBadBoom(paper,x,y,SPLASH_RADIUS) {
   var boom = paper.circle(x,y,1).attr("fill","#ff0");
   boom.animate({r: SPLASH_RADIUS-5},500,
      function(){
           boom.animate({opacity: 0},400,function(){boom.remove();});
      });
}

var missilesInFlight = {};
function drawAttack(paper,missile) {
	
	var startMissile = paper.path("M " + missile.t + " 2" );
	startMissile.attr("width","3").attr("missileId",startMissile.id).animate( 
		{ 
        path: "M" + missile.t + " 2 L" + missile.b + " " + BOARD_HEIGHT 
      },                                                                
     missile.ATTACK_SPEED,
     function() { 
          socket.send('removeMissile',missile);
		  removeMissile(startMissile);
          doBadBoom(paper,missile.b,BOARD_HEIGHT,missile.SPLASH_RADIUS); 
	});
	missilesInFlight[missile.id] = startMissile;

}

// this removes the missile on the screen
function removeMissile(startMissile) {
        startMissile.animate({opacity: 0},1600,
           function() {
             startMissile.remove();
           });
}

