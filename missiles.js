// Coordinates for the base
var BOARD_HEIGHT = 500;
var BOARD_WIDTH = 700;
var commandxy = [350,BOARD_HEIGHT];
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
var paper;
var hitsThisLevel = 0;
var attackInterval;

var Missle = {};
var socket = new io.Socket();
var start =  function () {
  
  paper = Raphael("canvas",BOARD_WIDTH,BOARD_HEIGHT);

  // Creates circle (base) at x, y, with radius 10
  var base = paper.circle(commandxy[0], commandxy[1], 10);
  // Sets the fill attribute of the circle to red (#f00)
  base.attr("fill", "#f0f");

  // Sets the stroke attribute of the circle to white
  base.attr("stroke", "#000");

  $("#canvas").click( fire );

  $("#play").click( startGame );
  // This starts the flood of missiles.

};

function startGame() {
  attackInterval = setInterval( function(){ doAttack(paper); },3000 );
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
  if(missileCount < 2) {
     missileCount++;

     // this works in Chrome
     var fireX = e.offsetX;
     var fireY = e.offsetY;

     // this works in firefox
     if(!fireX) {
        fireX = e.pageX-e.currentTarget.offsetLeft;
        fireY = e.pageY-e.currentTarget.offsetTop;
      }

      var mDist = dist(commandxy,[fireX,fireY]);
      
      // set the time in air of the missile based
      // on how far it will go.
      var missileTimeInAir = Math.floor(2000 * (mDist/BOARD_HEIGHT));
      startMissile.attr("width","3").animate(
      {
         path: "M" + commandxy[0] + " " + commandxy[1] + "L"+ fireX + " " + fireY
       },   
       missileTimeInAir, 
       function() { 
            missileCount--;
            doBoom(paper,fireX,fireY); 
            startMissile.animate({opacity:0},1600,function(){startMissile.remove();});
       });
       shots++;
   }
}

function drawFire(baseX,baseY) {

     var startMissile = paper.path("M " + baseX + " " + baseY );  
}

// do the explosion animation for your attack
function doBoom(paper,x,y) {
   var boom = paper.circle(x,y,1).attr("fill","#f00");
   boom.animate({r: SPLASH_RADIUS},500,
      function(){
           boom.animate({opacity: 0},400,function(){boom.remove();});
      });
}

// do explosion animation for enemy attack
function doBadBoom(paper,x,y) {
   var boom = paper.circle(x,y,1).attr("fill","#ff0");
   boom.animate({r: SPLASH_RADIUS-5},500,
      function(){
           boom.animate({opacity: 0},400,function(){boom.remove();});
      });
}

function drawAttack(paper,missile) {

	var startMissile = paper.path("M " + randomTop + " 2" );
	startMissile.attr("width","3").attr("missileId",startMissile.id).animate( 
		{ 
        path: "M" + randomTop + " 2 L" + randomBottom + " " + BOARD_HEIGHT 
      },                                                                
     ATTACK_SPEED,
     function() { 
          removeMissile(startMissile); 
          doBadBoom(paper,randomBottom,BOARD_HEIGHT); 
	});

}

// this removes the missile on the screen
function removeMissile(startMissile) {
        startMissile.animate({opacity: 0},1600,
           function() {
             var missileId = this.id;
             delete missilesInFlight[missileId];
             missilesInFlight[missileId] = null;
             startMissile.remove();
           });
}


