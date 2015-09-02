//Initialize the Game and starts it.
var game = new Game();

function init() {
  if (game.init())
    game.start();
}

// Returns a random integer between min (included) and max (excluded)
function getRandomInt(min, max) {
  if (min > max) {
    return -1;
  }

  if (min == max) {
    return min;
  }

  var r;

  do {
    r = Math.random();
  }
  while (r == 1.0);

  return min + parseInt(r * (max - min + 1));
}

// calculate readable time
String.prototype.toHHMMSS = function() {
  var secnum = parseInt(this, 10);
  var hours = Math.floor(secnum / 3600);
  var minutes = Math.floor((secnum - (hours * 3600)) / 60);
  var seconds = secnum - (hours * 3600) - (minutes * 60);

  if (hours < 10) {
    hours = '0' + hours;
  }

  if (minutes < 10) {
    minutes = '0' + minutes;
  }

  if (seconds < 10) {
    seconds = '0' + seconds;
  }

  if (hours < 1) {
    return minutes + ':' + seconds;
  } else {
    return hours + ':' + minutes + ':' + seconds;
  }

};


/**
 * Life
 */
function ShowStatusLife(stat) {
  if (stat == 3) {
    document.getElementById('statuslife3full').style.display = 'block';
    document.getElementById('statuslife2full').style.display = 'none';
    document.getElementById('statuslife1full').style.display = 'none';
    document.getElementById('statuslife0full').style.display = 'none';
  }
  if (stat == 2) {
    document.getElementById('statuslife3full').style.display = 'none';
    document.getElementById('statuslife2full').style.display = 'block';
    document.getElementById('statuslife1full').style.display = 'none';
    document.getElementById('statuslife0full').style.display = 'none';
  }
  if (stat == 1) {
    document.getElementById('statuslife3full').style.display = 'none';
    document.getElementById('statuslife2full').style.display = 'none';
    document.getElementById('statuslife1full').style.display = 'block';
    document.getElementById('statuslife0full').style.display = 'none';
  }
  if (stat === 0) {
    document.getElementById('statuslife3full').style.display = 'none';
    document.getElementById('statuslife2full').style.display = 'none';
    document.getElementById('statuslife1full').style.display = 'none';
    document.getElementById('statuslife0full').style.display = 'block';
  }
}


/**
 * Creates the Drawable object which will be the base class for
 * all drawable objects in the game. Sets up defualt variables
 * that all child objects will inherit, as well as the defualt
 * functions.
 */
function Drawable () {
  this.init = function(x, y, width, height) {
    // Defualt variables
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  };

  this.speed = 0;
  this.canvasWidth = 0;
  this.canvasHeight = 0;

  // Define abstract function to be implemented in child objects
  this.draw = function() {};

  this.move = function() {};
}

/**
 * Background object
 */
function Background() {
  this.speed = 1; // Redefine speed of the background for panning

  // Implement abstract function
  this.draw = function() {
    // Pan background
    this.y += this.speed;
    this.context.drawImage(imageRepository.background, this.x, this.y);

    // Draw another image at the top edge of the first image
    this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);

    // If the image scrolled off the screen, reset
    if (this.y >= this.canvasHeight)
      this.y = 0;
  };
}

Background.prototype = new Drawable();

/**
 * Obstacle object
 */
function Obstacle(obstacle) {
  this.alive = false; // Is true if the obstacle is currently in use
  //this.obstacle = imageRepository.obstacle01;
  this.obstacle = obstacle;
  this.speed = 2;

  // Sets the obstacle values
  this.spawn = function(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.alive = true;
  };

  this.draw = function() {
    this.y += this.speed;

    if (this.y >= this.canvasHeight) {
      this.y = 0;
      return true;
    } else {
      this.context.drawImage(this.obstacle, this.x, this.y);
      return false;
    }

  };

  this.clearObArea = function() {
    this.context.clearRect(this.x - 1, this.y - 1,
      this.width + 2, this.height + 2);
  };

  this.handleCollisions = function() {
    var bwidth = imageRepository.buddha.width;
    var bheight = imageRepository.buddha.height;
    var fit = 30;
    var bx = game.buddhaO.x + bwidth / 2;
    var by = game.buddhaO.y + bheight / 2;
    var ox = this.x + this.width / 2;
    var oy = this.y + this.height / 2;
    var coll = collisionTest(ox, oy, this.width - fit, bx, by, bwidth - fit);
    if (coll === true) {
      this.context.clearRect(this.x - 1, this.y - 1,
        this.width + 2, this.height + 2);
      return true;
    } else {
      return false;
    }
  };

  // Resets the obstacle values
  this.clear = function() {
    this.x = 0;
    this.y = 0;
    this.speed = 0;
    this.alive = false;
  };

}

Obstacle.prototype = new Drawable();


/**
 * Pool holds obstacles to be managed to prevent garbage collection.
 */
function Pool(maxSize) {
  var size = maxSize; // Max obstacles allowed in the pool
  var pool = [];
  this.counter = 0;

  // populate the pool array with obstacles
  this.init = function() {
    for (var i = 0; i < size; i++) {
      // Initalize the obstacle object
      obstacletyp = obstaclePic();
      var obstacle = new Obstacle(obstacletyp);
      obstacle.init(0, 0, obstacletyp.width,
        obstacletyp.height);
      pool[i] = obstacle;
    }
  };

  /*
   * Grabs the last item in the list and initializes it and
   * pushes it to the front of the array.
   */
  this.get = function(x, y, speed) {
    if (!pool[size - 1].alive) {
      pool[size - 1].spawn(x, y, speed);
      pool.unshift(pool.pop());
    }
  };

  // Clear Obstacle areas
  this.clearobstscreen = function() {
    for (var i = 0; i < size; i++) {
      if (pool[i].alive) {
        pool[i].clearObArea();
      }
    }
  };

  /*
   * Draws any in use obstacle.
   */
  this.animate = function() {
    this.counter++;
    var timediv = (new Date().getTime() - game.gamestarttime) / 1000;

    //var speedrate = timediv;
    var minspeed = 1;
    var speedrate = 3;
    var obstacleRate = 100;

    if (timediv >= 60 && timediv < 120) {
      minspeed = 1.5;
      speedrate = 3;
      obstacleRate = 80;
    } else if (timediv >= 120 && timediv < 180) {
      minspeed = 2;
      speedrate = 3;
      obstacleRate = 70;
    } else if (timediv >= 180 && timediv < 240) {
      minspeed = 2;
      speedrate = 4;
      obstacleRate = 60;
    } else if (timediv >= 240 && timediv < 300) {
      minspeed = 3;
      speedrate = 4;
      obstacleRate = 50;
    } else if (timediv >= 300) {
      minspeed = 3;
      speedrate = 5;
      obstacleRate = 40;
    }

    // Draw obstacles or create new ones
    for (var i = 0; i < size; i++) {

      // Only draw until we find a obstacle that is not alive
      if (pool[i].alive) {
        if (pool[i].draw()) {
          pool[i].clear();
          pool.push((pool.splice(i, 1))[0]);
        }

        if (pool[i].handleCollisions()) {
          game.hitface = true;
          game.hitfacetime = new Date().getTime();
          if (game.life == 3) {
            ShowStatusLife(2);
            game.life = 2;
            pool[i].clear();
            pool.push((pool.splice(i, 1))[0]);
          } else if (game.life == 2) {
            ShowStatusLife(1);
            game.life = 1;
            pool[i].clear();
            pool.push((pool.splice(i, 1))[0]);
          } else if (game.life == 1) {
            ShowStatusLife(0);
            game.life = 0;
            game.gameover = true;
            break;
          }
        }
      } else {
        var xRand = getRandomInt(0 + pool[i].width / 2,
          800 - pool[i].width / 2);
        var yspeed = minspeed + Math.random() * speedrate;
        if (this.counter >= obstacleRate) {
          if (!pool[size - 1].alive) {
            this.counter = 0;
            this.get(xRand, 0, yspeed);
          }
        }

        //break;
      }
    }
  };

}


/**
 * Obstacles to catch
 */
function CatchPool() {
  var size = 10; // Max obstacles allowed in the pool
  var pool = [];
  this.counter = 0;

  // Initialize the catch object(s)
  this.init = function() {
    for (var i = 0; i < size; i++) {
      // Initalize the obstacle object
      obstacletyp = starPic();
      var obstacle = new Obstacle(obstacletyp);
      obstacle.init(0, 0, obstacletyp.width,
        obstacletyp.height);
      pool[i] = obstacle;
    }
  };

  /*
   * Grabs the last item in the list and initializes it and
   * pushes it to the front of the array.
   */
  this.get = function(x, y, speed) {
    if (!pool[size - 1].alive) {
      pool[size - 1].spawn(x, y, speed);
      pool.unshift(pool.pop());
    }
  };

  // Clear Obstacle areas
  this.clearobstscreen = function() {
    for (var i = 0; i < size; i++) {
      if (pool[i].alive) {
        pool[i].clearObArea();
      }
    }
  };

  /*
   * Draws any in use obstacle.
   */
  this.animate = function() {
    this.counter++;
    var timediv = (new Date().getTime() - game.gamestarttime) / 1000;

    //var speedrate = timediv;
    var minspeed = 1;
    var speedrate = 3;
    var obstacleRate = 70;

    // Draw obstacles or create new ones
    for (var i = 0; i < size; i++) {

      // Only draw until we find a obstacle that is not alive
      if (pool[i].alive) {
        if (pool[i].draw()) {
          pool[i].clear();
        }

        if (pool[i].handleCollisions()) {
          pool[i].clear();
          game.score += 10;
        }

      } else {
        var xRand = getRandomInt(0 + pool[i].width / 2,
          800 - pool[i].width / 2);
        var yspeed = minspeed + Math.random() * speedrate;
        if (this.counter >= obstacleRate) {
          if (!pool[i].alive) {
            this.counter = 0;
            this.get(xRand, 0, yspeed);
          }
        }
      }

    }



  };

}


/**
 * Buddha object
 */
function Buddha() {
  this.speed = 5;
  this.omt = false;
  this.flameleft = sprite({
    context: game.buddhaContext,
    width: 243,
    height: 45,
    image: imageRepository.flameleft,
    numberOfFrames: 3,
    ticksPerFrame: 12
  });
  this.flameright = sprite({
    context: game.buddhaContext,
    width: 243,
    height: 45,
    image: imageRepository.flameright,
    numberOfFrames: 3,
    ticksPerFrame: 12
  });

  this.draw = function() {
    if (game.hitface === true) {
      this.context.drawImage(imageRepository.buddhaO , this.x, this.y);
    } else {
      this.context.drawImage(imageRepository.buddha , this.x, this.y);
    }

    if (this.fleft) {
      this.flameleft.update();
      this.flameleft.render(this.x + 168, this.y + 80);
      this.omt = true;
      this.start = new Date().getTime();
    } else if (this.fright) {
      this.flameright.update();
      this.flameright.render(this.x - 55, this.y + 72);
      this.omt = true;
      this.start = new Date().getTime();
    }

  };

  this.drawsimple = function() {
    this.context.drawImage(imageRepository.buddhasad, this.x, this.y);
  };

  this.move = function() {
    this.fleft = false;
    this.fright = false;

    // Determine if the action is move action
    if (KEY_STATUS.left || KEY_STATUS.right ||
      KEY_STATUS.down || KEY_STATUS.up) {
      // Erase it's current image
      this.flameleft.clear(this.x + 168, this.y + 80);
      this.flameright.clear(this.x - 55, this.y + 72);
      this.context.clearRect(this.x, this.y, this.width, this.height);

      // Update x and y according to the direction to move and
      // redraw the ship. Change the else if's to if statements
      // to have diagonal movement.
      if (KEY_STATUS.left) {
        this.fleft = true;
        this.fright = false;
        this.x -= this.speed;
        if (this.x <= 0) // Keep player within the screen
          this.x = 0;

      } else if (KEY_STATUS.right) {
        this.fleft = false;
        this.fright = true;
        this.x += this.speed;
        if (this.x >= this.canvasWidth - this.width)
          this.x = this.canvasWidth - this.width;

      } else if (KEY_STATUS.up) {
        this.y -= this.speed;
        if (this.y <= this.canvasHeight / 3)
          this.y = this.canvasHeight / 3;

      } else if (KEY_STATUS.down) {
        this.y += this.speed;
        if (this.y >= this.canvasHeight - this.height)
          this.y = this.canvasHeight - this.height;

      }

      // Finish by redrawing the Buddha
      this.draw();
    }

    if (this.omt) {
      var end = new Date().getTime();
      var diff = (end - this.start);
      if (diff >= 50) {
        this.omt = false;
        this.flameleft.clear(this.x + 168, this.y + 80);
        this.flameright.clear(this.x - 55, this.y + 72);
        if (game.hitface === true) {
          this.context.drawImage(imageRepository.buddhaO , this.x, this.y);
        } else {
          this.context.drawImage(imageRepository.buddha , this.x, this.y);
        }
      }
    }

    if (game.hitface === true) {
      var endhitface = new Date().getTime();
      var diffhitface = (endhitface - game.hitfacetime);
      if (diffhitface >= 800) {
        game.hitface = false;
        this.context.drawImage(imageRepository.buddha , this.x, this.y);
      } else {
        this.context.drawImage(imageRepository.buddhaO , this.x, this.y);
      }
    }

  };
}

Buddha.prototype = new Drawable();

/**
 * Creates the Game object which will hold all objects and data for the game.
 */
function Game() {
  /*
   * Gets canvas information and context and sets up all game
   * objects.
   * Returns true if the canvas is supported and false if it
   * is not. This is to stop the animation script from constantly
   * running on older browsers.
   */
  this.init = function() {
    // Get the canvas element
    this.backgroundCanvas = document.getElementById('backgroundID');
    this.buddhaCanvas = document.getElementById('buddhaID');
    this.obstaclesCanvas = document.getElementById('obstaclesID');

    // Test to see if canvas is supported
    if (this.backgroundCanvas.getContext) {
      this.backgroundContext = this.backgroundCanvas.getContext('2d');
      this.buddhaContext = this.buddhaCanvas.getContext('2d');
      this.obstaclesContext = this.obstaclesCanvas.getContext('2d');

      // Initialize objects to contain their context and canvas
      // information
      Background.prototype.context = this.backgroundContext;
      Background.prototype.canvasWidth = this.backgroundCanvas.width;
      Background.prototype.canvasHeight = this.backgroundCanvas.height;

      Buddha.prototype.context = this.buddhaContext;
      Buddha.prototype.canvasWidth = this.buddhaCanvas.width;
      Buddha.prototype.canvasHeight = this.buddhaCanvas.height;

      Obstacle.prototype.context = this.obstaclesContext;
      Obstacle.prototype.canvasWidth = this.obstaclesCanvas.width;
      Obstacle.prototype.canvasHeight = this.obstaclesCanvas.height;

      // Initialize the background object
      this.background = new Background();
      this.background.init(0, 0); // Set draw point to 0,0

      // Initilize the obstacles object
      this.obstaclePool = new Pool(30);
      this.obstaclePool.init();

      // Initilize the obstacles to catch object
      this.catchPool = new CatchPool();
      this.catchPool.init();

      // Initialize the buddha object
      this.buddhaO = new Buddha();

      this.buddhaStartX = this.buddhaCanvas.width / 2 - imageRepository.buddha
        .width / 2;
      this.buddhaStartY = this.buddhaCanvas.height / 3;
      this.buddhaO.init(this.buddhaStartX, this.buddhaStartY,
        imageRepository.buddha.width, imageRepository.buddha.height);

      this.gamestarttime = new Date().getTime();
      this.playtime = 0;
      this.score = 0;
      this.highscore = 0;
      this.life = 3;
      this.ingame = false;
      this.gameover = false;
      this.played = false;
      this.hitface = false;
      this.hitfacetime = 0;

      return true;
    } else {
      return false;
    }
  };

  // Start the animation loop
  this.start = function() {
    this.buddhaO.draw();
    animate();
  };

  // startbutton
  this.startbutton = function() {
    document.getElementById('gametitle').style.display = 'none';
    document.getElementById('timescoreclass').style.display = 'block';
    document.getElementById('scoreclass').style.display = 'block';
    this.gamestarttime = new Date().getTime();
    ShowStatusLife(this.life);
    this.timedivB = 5;
    this.playtime = 0;
    this.score = 0;
    this.ingame = true;
  };

  // Game over
  this.gameOver = function() {
    document.getElementById('game-over').style.display = 'block';
    this.ingame = false;
    this.gameover = false;
    this.played = true;

    this.backgroundContext.clearRect(
      0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
    this.obstaclesContext.clearRect(
      0, 0, this.obstaclesCanvas.width, this.obstaclesCanvas.height);
    this.buddhaContext.clearRect(
      0, 0, this.buddhaCanvas.width, this.buddhaCanvas.height);
    this.buddhaO.init(this.buddhaStartX, this.buddhaStartY,
      imageRepository.buddhasad.width, imageRepository.buddhasad.height);
    this.buddhaO.drawsimple();

    if (this.score > this.highscore) {
      // Modal for highscore list
      ScoresViewModel.beginAdd();
    }

  };

  // Restart the game
  this.restart = function() {
    document.getElementById('game-over').style.display = 'none';

    this.life = 3;
    ShowStatusLife(this.life);
    this.obstaclePool.init();
    this.catchPool.init();
    this.gamestarttime = new Date().getTime();
    this.timedivB = 0;
    this.playtime = 0;
    this.score = 0;
    this.hitface = false;
    this.hitfacetime = 0;
    this.ingame = true;

  };

  // Score
  this.funcscore = function() {
    var timediv = (new Date().getTime() - this.gamestarttime) / 1000;
    this.playtime = timediv.toString().toHHMMSS();
    if (timediv - this.timedivB >= 10) {
      this.timedivB = timediv;
      this.score += 5;
    }
  };

}


/**
 * The animation loop
 */
function animate() {
  if (game.gameover === true) {
    game.gameOver();
  }

  if (game.ingame === true) {
    requestAnimFrame(animate);
    game.background.draw();
    game.buddhaO.move();
    game.obstaclePool.clearobstscreen();
    game.catchPool.clearobstscreen();
    game.obstaclePool.animate();
    game.catchPool.animate();
    game.funcscore();
    document.getElementById('timescore').innerHTML = game.playtime;
    document.getElementById('score').innerHTML = game.score;
  } else {
    requestAnimFrame(animate);
    game.background.draw();

    if (KEY_STATUS.space) {
      if (game.played === false) {
        game.startbutton();
      } else {
        game.restart();
      }
    }
  }
}

// The keycodes that will be mapped when a user presses a button.
// Original code by Doug McInnes
KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down'
};

// Creates the array to hold the KEY_CODES and sets all their values
// to false. Checking true/flase is the quickest way to check status
// of a key press and which one was pressed when determining
// when to move and which direction.
KEY_STATUS = {};
for (var code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}
/**
 * Sets up the document to listen to onkeydown events (fired when
 * any key on the keyboard is pressed down). When a key is pressed,
 * it sets the appropriate direction to true to let us know which
 * key it was.
 */
document.onkeydown = function(e) {
  // Firefox and opera use charCode instead of keyCode to
  // return which key was pressed.
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
};

/**
 * Sets up the document to listen to ownkeyup events (fired when
 * any key on the keyboard is released). When a key is released,
 * it sets teh appropriate direction to false to let us know which
 * key it was.
 */
document.onkeyup = function(e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = false;
  }
};

/**
 * requestAnim shim layer by Paul Irish
 * Finds the first API that works to optimize the animation loop,
 * otherwise defaults to setTimeout().
 */
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(/* function */ callback, /* DOMElement */ element) {
      window.setTimeout(callback, 1000 / 60);
    };
})();