// Coordinates for the base
var commandxy = [200,400];
var BOARD_HEIGHT = 400;
var BOARD_WIDTH = 400;
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

var start =  function () {
  
  paper = Raphael("canvas",400,400);
  //var paper = Raphael(10, 50, 320, 200);

  // Creates circle (base) at x, y, with radius 10
  var base = paper.circle(commandxy[0], commandxy[1], 10);
  // Sets the fill attribute of the circle to red (#f00)
  base.attr("fill", "#f0f");

  // Sets the stroke attribute of the circle to white
  base.attr("stroke", "#000");

  $("#canvas").click( fire );

  // This starts the flood of missiles.
  attackInterval = setInterval( function(){ doAttack(paper); },3000 );

};

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
     var startMissile = paper.path("M " + commandxy[0] + " " + commandxy[1] );     
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

// do the explosion animation for your attack
function doBoom(paper,x,y) {
   var boom = paper.circle(x,y,1).attr("fill","#f00");
   boom.animate({r: SPLASH_RADIUS},500,
      function(){
           boom.animate({opacity: 0},400,function(){boom.remove();});
           detectHit(x,y,SPLASH_RADIUS);
      });
}

// do explosion animation for their attack
function doBadBoom(paper,x,y) {
   var boom = paper.circle(x,y,1).attr("fill","#ff0");
   boom.animate({r: SPLASH_RADIUS-5},500,
      function(){
           boom.animate({opacity: 0},400,function(){boom.remove();});
           detectBaseHit(x,y,SPLASH_RADIUS-5);
      });
}

// this fires one missile from a random point to a random point
function doAttack(paper) {
  var randomTop = Math.floor(Math.random()*BOARD_WIDTH);   
  var randomBottom = Math.floor(Math.random()*BOARD_WIDTH);
  var startMissile = paper.path("M " + randomTop + " 2" );
  startMissile.startPt = [randomTop,2];
  startMissile.endPt = [randomBottom,BOARD_HEIGHT];

  var missileId = startMissile.id;
  missilesInFlight[missileId] = startMissile;
  startMissile.created = (new Date()).getTime();

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

function removeMissile(startMissile) {
        startMissile.animate({opacity: 0},1600,
           function() {
             var missileId = this.id;
             delete missilesInFlight[missileId];
             missilesInFlight[missileId] = null;
             startMissile.remove();
           });
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
   var baseHit = ptWithin([x,y],commandxy,r);
   if(baseHit) {
      updateFromBaseHit(commandxy);
   }
}

// if so end game
function updateFromBaseHit(commandxy) {
    alert("Game Over. Try again?");
    window.location.reload();
}

function detectHit(x,y,r) {
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
          score += Math.floor(SCORE_PER_MISSILE);
          $("#score").text("Score: " + score);
          m.stop();
          removeMissile(m);
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
</script>

</head>
<body>
<div class="fonts"><div id="level">Level: 1</div><br>
<div id="score">Score: 0</div></div>
<br><br><div id="canvas"></div>
</body>


</html>
