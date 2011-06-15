// this fires one missile from a random point to a random point
function doAttack() {
  var randomTop = Math.floor(Math.random()*BOARD_WIDTH);
  var randomBottom = Math.floor(Math.random()*BOARD_WIDTH);
  var startMissile = {};
  startMissile.startPt = [randomTop,2];
  startMissile.endPt = [randomBottom,BOARD_HEIGHT];

  var missileId = startMissile.id;
  missilesInFlight[missileId] = startMissile;
  startMissile.created = (new Date()).getTime();

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
    stopInterval(attackInterval);
    // window.location.reload();
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

