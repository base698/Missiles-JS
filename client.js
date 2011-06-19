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
		// update all scores with players
		drawScores(m.players);
		removeMissile(missilesInFlight[m.missile.id]);
	} else if(m.action == 'level') {
		$('#level').html('Level: '+m.level);
	} else if(m.action == 'name') {
		drawScores(m.players);
	} else if(m.action == 'dead') {
		drawScores(m.players);
		// XXX destroy base on screen
	}
}

function drawScores(players) {
   $('.stats').html('<h3>Scores</h3>');
 for(var i=0;i<players.length;i++) {
   var player = players[i];
   if(player.dead) {
   	$('.stats').append('<div class="red" id="'+players[i].id+'">'+players[i].name+': '+ players[i].score + '</div>');
   } else {
   	$('.stats').append('<div id="'+players[i].id+'">'+players[i].name+': '+ players[i].score + '</div>');
   }
 }
}

function drawBases(players) {
    for(var i=0;i<players.length;i++) {
		var player = players[i];
		var commandxy = player.commandxy;
		var id = player.id;
		// Creates circle (base) at x, y, with radius 10
  		var base = paper.image('base.svg',commandxy[0]-15, commandxy[1]-25, 40,50);
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
	$("#name").change(function(e) {
		console.log($(this).val());
		console.log($(this).attr('playerId'));
		//socket.send({action:'name',id:$(this).attr('playerId'),name:$(this).val()});
	});
	
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
	var start = missile.startPt;
	var end = missile.endPt;
	var startMissile = paper.image('missile.png',start[0],start[1],40,20); 
	
	// Calculate rotation
	var radians = Math.atan((end[0]-start[0])/(end[1]-start[1]));
	var theta = radians *  180 / Math.PI;
	console.log(theta);
	startMissile = startMissile.rotate(-90).rotate(-theta);
	// do animation
	
	startMissile.attr("missileId",startMissile.id).animate( 
		{ 
        x: end[0],
		y: end[1] 
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

