(function(){
  'use strict'; 
  var SU = 32; 
  var STATE_COVER = 0;
  var STATE_MENU = 1; 
  var STATE_GAMEOVER = 2;
  var STATE_PLAY = 3; 
  Math.DEG = Math.PI/180;

  var canvas = null;
  var ctx = null; 
  var lastPress = null; 
  var pressing = [];
  var touches = [];
  var accelX = 0, accelY = 0;
  var time = 0, scale = 1; 

  var dragging = false;
  var btnPause, btnExit;
  var btnControlModes = [], btnMove = [];
  var controlModes = ['Tilt', 'Buttons', 'Drag', 'Followtouch', 'Gestures', 'VirtualPad'];

  var screenDebug = false; 
  var pause = false; 
  var state = 0, controlMode = 0;
  var speed = 0; 
  var score = 0; 
  var dropTimer = 0;
  var bg = 0; 
  var player; 
  var enemies = []; 
  var clouds = []; 
  var drops = []; 
  var explosion = []; 
  var iSprites = new Image();
  var iBg = new Image();

  window.addEventListener('load', init, false);
  window.addEventListener('resize', resize, false); 
  //window.addEventListener('focus', function(){if(state==STATE_PLAY)pause=false},false);
  window.addEventListener('blur', function(){if(state==STATE_PLAY)pause=true}, false);

  function random(max){
    return Math.random() * max; 
  }

  function init(){
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    enableInputs();
    setDensity();
    resize();
    onReady();
    run();
  }

  
  function run(){
    requestAnimationFrame(run);

    var now = Date.now();
    var deltaTime = now - (time || now);
    time = now;

    act(deltaTime);
    //paint(ctx);
  }

  function act(dt){
    if(state == STATE_COVER){
      if(lastPress == 1 || lastPress == 13){
        state = STATE_MENU;
      }
      //clouds
      for(var i = 0, l=clouds.length;i<l;i++){
        clouds[i].y -= speed * dt * 0.01;//update clouds position base on the spped
        if(clouds[i].y < -SU*2){
          clouds.splice(i--, 1);
          l--;
        }
      }
      if(i < 1 || clouds[i-1].y < canvas.height - SU * 6){
        clouds.push({x:~~random(canvas.width) - 64, y: canvas.height});//add another cloud
      }
    }
    else if(state == STATE_MENU){
     if(lastPress == 1){
      for(var i = 0, l=btnControlModes.length;i<l;i++){
        if(btnControlModes[i].touch()){
          controlMode = i;
          state = STATE_PLAY;
          break;
        }
      }
     }else if(lastPress == 13){
      state = STATE_PLAY;
     } 
    }else{
      var ct = dt * 0.02;
      if(pause){
        if(lastPress == 1 && btnExit.touch()){
          player.health = 0;
          state = STATE_COVER;
        }
      }else{
        if(state == STATE_PLAY){
          //Gameover reset
          if(player.health < 1){
            reset();
          }

          setPlayerMovement();
          player.rotation = player.vx * 30;

          //Move player
          if(controlMode != 2){//control_DRAG
            player.x += player.vx * speed * ct;
            player.y += player.vy * speed * ct;
          }
          
          //Player outbounds
          if(player.x < player.radius){
            player.x = player.radius;
            player.vx = 0;
          }
          if(player.x > canvas.width - player.radius){
            player.x = canvas.width - player.radius;
            player.vx = 0;
          }
          if(player.y < player.radius){
            player.y = player.radius;
            player.vy = 0;
          }
          if(player.y > canvas.height - player.radius){
            player.y = canvas.height - player.radius;
            player.vy = 0;
          }

          //Move Background
          bg += speed * dt * 0.0001;
          if(bg > SU*15){
            bg = SU * 15;
          }
        }else{
          if(speed > SU/4){
            speed -= SU/64;
          }else{
            speed = SU/4;
          }
        }     

        //Clouds
        for(var i=0, l=clouds.length;i<l;i++){
          clouds[i].y -= speed * ct * 0.5;
          if(clouds[i].y < -SU*2){
            clouds.splice(i--, 1);
            l--;
          }
        }

        if(i < 1 || clouds[i-1].y < canvas.height - SU*6){
          clouds.push({x:~~random(canvas.width)-64, y: canvas.height});
        }
        
        //Enemies
        for(var i = 0, l=enemies.length; i<l;i++){
          enemies[i].y -= speed * ct;
          enemies[i].rotation += 10 * ct; 
          if(enemies[i].y < -enemies[i].radius){
            enemies.splice(i--,1);
            l--;
            continue;
          }

          if(state == STATE_PLAY && player.timer < 1 && enemies[i].distance(player)<0){
            player.health--; //player is hit by an enemy
            if(player.health<1){
              for(var j=0;j<8;j++){
                var e = new Circle(player.x, player.y, SU/4);
                e.rotation = 45 * j + 22.5;
                e.timer = 2000;
                explosion.push(e);
              }
            }else {
              player.timer = 1000;
            }
          }
        }

        if(i < 1 || enemies[i-1].y < SU * 15){
          enemies.push(new Circle(~~random(canvas.width), SU*30, SU*0.75));
        }

        //Drops, raindrop
        for(var i =0, l=drops.length;i<l;i++){
          drops[i].y -= speed * ct;
          drops[i].timer += dt;
          if(drops[i].timer > 400){
            drops[i].timer -= 400;
          }
          if(drops[i].y < -drops[i].radius){
            drops.splic(i--,1);
            l--;
            continue;
          }
          if(state == STATE_PLAY && drops[i].distance(player)<0){
            score++;
            speed += 0.1;
            drops.splice(i--,1);
            l--;
          }
        }

        if(dropTimer > 0){
          dropTimer -= dt; 
        }else{
          var type = ~~random(6);
          var x = ~~random(canvas.width - SU * 2) + SU;
          if(type == 1){
            for(var i = 0; i<5; i++){
              drops.push(new Circle (x - SU + SU * i * 0.5, canvas.height + SU * i, SU/2));
            }
          }else if(type == 2 ){
            for(var i =0; i<5; i++){
              drops.push(new Circle(x + SU - SU * i * 0.5, canvas.height + SU * i, SU/2));
            }
          }else if(type == 3){
            for(var i = 0; i< 3; i++){
              drops.push(new Circle(x, canvas.height + SU * i, SU/2));
            }
            drops.push(new Circle(x + SU, canvas.height + SU, SU/2));
            drops.push(new Circle(x - SU, canvas.height + SU, SU/2));
          }else if(type == 4){
            drops.push(new Circle(x - SU, canvas.height, SU/2));
            drops.push(new Circle(x + SU, canvas.height, SU/2));
            drops.push(new Circle(x, canvas.height + SU, SU/2));
            drops.push(new Circle(x - SU, canvas.height + SU * 2, SU/2));
            drops.push(new Circle(x + SU, canvas.height + SU * 2, SU/2));
          }else{
            for(var i = 0; i<5;i++){
              drops.push(new Circle(x, canvas.height + SU * i, SU/2));
            }
          }
          dropTimer = 2000;
        }

        //Move explosion
        for(var i = 0, l = explosion.length; i<l; i++){
          var angle = (explosion[i].rotation - 90)*Math.PI/180;
          explosion[i].x += Math.cos(angle) * SU/8;
          explosion[i].y += Math.sin(angle) * SU/8;
          explosion[i].timer -= dt;
          if(explosion[i].timer < 1){
            explosion.splice(i--, 1);
            l--;
          }else if(explosion[i].rotation < 180){
            explosion[i].rotation += 2 * ct; 
          }else if(explosion[i].rotation > 180){
            explosion[i].rotation -= 2 * ct;
          }
        }

        //End game
        if(player.health < 1) state = STATE_GAMEOVER;
        else if(player.timer > 0) player.timer -= dt;
      }
      //Pause
      if(lastPress == 1 || lastPress == 13){
        if(state == STATE_GAMEOVER){
          if(btnExit.touch()){
            state = STATE_COVER;
          }else{
            state = STATE_PLAY;
          }
        }else if(lastPress == 13 || pause || btnPause.touch()){
          pause = !pause;
        }
      }
    }
    //ScreenDebug
    if(lastPress == 75){
      screenDebug = !screenDebug;
    }
    lastPress = null;
  }

  function setDensity(){
    var VL = Math.min(window.innerWidth, window.innerHeight);
    if(VL < 480) SU = 32; 
    if(VL < 640) SU = 48; 
    if(VL < 960) SU = 64;
    else SU = 96;
    if(window.console) console.log('Square Unit: ' + SU);
  }//function setDensity()

  function resize(){
    if(window.innerWidth < window.innerHeight){
      canvas.width = SU * 10;
      canvas.height = ~~(canvas.width * window.innerHeight / window.innerWidth);
    }else {
      canvas.width = SU * 10;
      canvas.height = ~~SU * 15; //H_MIN = 13.3, H_NML = 15, H_MAX = 17.8
    }
    scale = canvas.height / window.innerHeight;
    canvas.style.width = (canvas.width/scale) + 'px';
    canvas.style.height = (canvas.height/scale) + 'px';
    if(window.console) console.log('Screen size: ' + canvas.width + 'x' + canvas.height + '; Scale: ' + scale);
  }//function resize() 

  function enableInputs(){
    if(window.DeviceMotionEvent){
      window.addEventListener('devicemotion', function(evt){
        accelX = evt.accelerationIncludingGravity.x;
        accelY = evt.accelerationIncludingGravity.y;
      }, false);
    }else if (window.console) console.warn('Device motion not supported');
    
    //touchstart
    canvas.addEventListener('touchstart', function(evt){
      evt.preventDefault();
      var t = evt.changedTouches;
      for(var i=0;i<t.length;i++){
        var x = ~~((t[i].pageX - canvas.offsetLeft) * scale);
        var y = ~~((t[i].pageY - canvas.offsetTop) * scale);
        touches[t[i].identifier] = new Vtouch(x,y);
      }
      lastPress = 1; 
    }, false);

    //touchmove
    canvas.addEventListener('touchmove', function(evt){
      evt.preventDefault();//we prevent the default and do whatever we want
      var t = evt.changedTouches; 
      for(var i = 0; i<t.length;i++){
        if(touches[t[i].identifier]){
          touches[t[i].identifier].x = ~~((t[i].pageX - canvas.offsetLeft) * scale);
          touches[t[i].identifier].y = ~~((t[i].pageY - canvas.offsetTop) * scale);
        }
      }
    },false); 

    //touchend
    canvas.addEventListener('touchend', function(evt){
      var t = evt.changedTouches;
      for(var i = 0; i < t.length; i++){
        touches[t[i].identifier] = null;
      }
    }, false);

    //touchcancel
    canvas.addEventListener('touchcancel', function(evt){
      var t = evt.changedTouches;
      for(var i = 0; i < t.length; i++){
        touches[t[i].identifier] = null;
      }
    }, false);

    //mousedown
    canvas.addEventListener('mousedown', function(evt){
      evt.preventDefault();
      var x = ~~((evt.pageX - canvas.offsetLeft) * scale);
      var y = ~~((evt.pageY - canvas.offsetTop) * scale);
      touches[0] = new Vtouch(x,y);
      lastPress = 1;
    },false);

    //mouseover
    canvas.addEventListener('mousemove', function(evt){
      if (touches[0]){
        touches[0].x = ~~((evt.pageX - canvas.offsetLeft) * scale);
        touches[0].y = ~~((evt.pageY - canvas.offsetTop) * scale);
      }  
    },false);
    
    //mouseup
    canvas.addEventListener('mouseup', function(evt){
      touches[0] = null;
    },false);

    //keydown
    document.addEventListener('keydown', function(evt){
      if (evt.keyCode > 36 && evt.keyCode < 41){
        evt.preventDefault();
      }
      if (!pressing[evt.keyCode]){
        lastPress = evt.keyCode;
      }
      pressing[evt.keyCode] = true;
    }, false);
    
    //keyup
    document.addEventListener('keyup', function(evt){
      pressing[evt.keyCode] = false;
    }, false);

    function Vtouch(x, y){
      this.x = x || 0;
      this.y = y || 0;
      this.ox = this.x;
      this.oy = this.y;
    }
  }//function enableInputs()

  function setPlayerMovement(){
    player.vx = 0;
    player.vy = 0;
    //We check what is our input control mode, by default is 0 - Tilt
    if(controlMode == 0){//Control with ACCELERATION
      //player.vx = -accelX/5;
      //player.vy = -accelY/5;
      if(accelX < -1){
        player.vx = 1;
      }else if(accelX > 1){
        plyaer.vx = -1; 
      }
      if(accelY < 5){
        player.vy = -1;
      }else if(accelY > 9){
        player.vy = 1;
      }
    }else if(controlMode == 1){//Control with BUTTONS
      for(i=0, l=btnMove.lngth;i<l;i++){//for every button that is pressed
        if(btnMove[i].touch()){
          if(i/3 < 1){//if touch value is less than 1, we interpret as diminishing X value
            player.vx -= 1;
          }else{//otherwise we add up X value
            player.vx += 1;
          }  
          if(i%3 == 0){//if the value is 0, Y diminishes
            player.vy = -1;
          }else if(i%3 == 2){//if the mod value is 2, Y goes up
            player.vy = 1;
          }
        }
      } 
    }else if(controlMode == 2){//Control with DRAG 
      if(touches[0]){
        if(lastPress == 1){
          if(player.radius + player.distancePoint(touches[0].x, touches[0].y) < SU){//if we touch the sprite
            dragging = true;
          }
        }else if(dragging){
          if(touches[0].x < player.x - speed * 0.02) player.vx = -1;//modify X velocity as negative to got left
          else if(touches[0].x > player.x + speed * 0.02) player.vx = 1;//modify X vel as positive to go right 
          if(touches[0].y < player.y - speed * 0.02) player.vy = -1;//modify Y vel as negative to go upward
          else if(touches[0].y < player.y + speed * 0.02) player.vy = 1;//modify Y vel as pos to go downward
          player.x = touches[0].x;//updating x,y sprite position
          player.y = touches[0].y;
        }
      }else if(dragging){
        dragging = false; 
      }    
    }else if(controlMode == 3){//Control with FollowTOUCH
      if(touches[0]){
        if(touches[0].x < player.x - SU/4){
          player.vx = -1;
        }else if(touches[0].x > player.x + SU/4){
          player.vx = 1;
        }if(touches[0].y < player.y - SU/4){
          player.vy = -1;
        }else if(touches[0].y > player.y + SU/4){
          player.vy = 1;
        }
      }
    }else if(controlMode == 4){//Control with GESTURES
      for(var i=0, l=touches.length;i<l;i++){
        if(touches[i]){
          if(touches[i].x < SU*5){
            player.vx -= 1;
          }else{
            player.vx += 1; 
          }if(touches[i].oy - touches[i].y > SU/4){//we control old and new to calculate Y vel
            player.vy = -1;
          }else if(touches[i].oy - touches[i].y < -SU/4){
            player.vy = 1;
          }
        }
      }
    }else if(controlMode == 5){//Control with VPAD 
      if(touches[0]){
        if(touches[0].ox - touches[0].x > SU/4){
          player.vx = -1;
        }else if(touches[0].ox - touches[0].x < -SU/4){
          player.vx = 1; 
        } 
        if(touches[0].oy - touches[0].y > SU/4){
          player.vy = -1;
        }else if(touches[0].oy - touches[0].y < -SU/4){
          player.vy = 1;
        }
      }
    }

    //Read keyboard input
    if(pressing[37]){ player.vx = -1;}
    if(pressing[38]){ player.vy = -1;}
    if(pressing[39]){ player.vx = 1;}
    if(pressing[40]){ player.vy = 1;}
  }

  function onReady(){
    btnPause = new Button(SU*4.5,SU/4,SU);
    btnExit = new Button(SU*3, SU*10, SU*4, SU);
    for(var i = 0; i<3; i++){
      btnMove[i] = new Button(0, SU*10 + SU*i, SU*2, SU);
      btnMove[i+3] = new Button(SU * 8, SU*10+SU*i, SU*2, SU);
    }
    for(var i = 0; i<controlModes.length; i++){
      btnControlModes.push(new Button(SU*2, SU*3+SU*1.5*i, SU * 6, SU));
    }

    player = new Circle(0, 0, SU * 0.75);
    iSprites.src = SU + '.sprites.png';
    iBg.src = 'bg.png';
    speed = SU/4;
  }//function onReady

  function reset(){
    player.x = canvas.width / 2;//Player
    player.y = SU * 2;
    player.health = 3;
    player.timer = 0; 
    enemies.length = 0;//Enemies
    clouds.length = 0;//Clouds
    drops.length = 0;//Drops
    explosion.length = 0;//Explosions
    speed = SU / 4;//Physics - Speed  
    score = 0;//Score 
    bg = 0;//Background 
  }//function reset()

  function Button(x, y, width, height){
    this.x = (x == null) ? 0 : x; 
    this.y = (y == null) ? 0 : y; 
    this.width = (width == null) ? 0 : width;
    this.height = (height == null) ? 0 : height;
    this.touch = function(){
      for(var i=0, l=touches.length; i<l; i++){
        if(touches[i] != null){
          if(this.x < touches[i].x &&
             this.x + this.width > touches[i].x &&
             this.y < touches[i].y &&
             this.y + this.height > touches[i].y){
            return true; 
          }
        }
      }
      return false;
    }

    this.stroke = function(){
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
    
    this.fillTextCenter = function(ctx, str){
      ctx.fillText(str, this.x + this.width/2, this.y + this.height - SU/4);
    }
  }

  function Circle(x, y, radius){
    this.x = (x == null ) ? 0 : x;   
    this.y = (y == null ) ? 0 : y;   
    this.radius = (radius == null ) ? 0 : radius;   

    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.health = 0; 
    this.timer = 0;

    this.distance = function(circle){
      if(circle != null){
        var dx = this.x - circle.x;  
        var dy = this.y - circle.y;  
        return (Math.sqrt(dx * dx + dy * dy)-(this.radius + circle.radius));
      }
    }

    this.distancePoint = function(x,y){
      if(y != null){
        var dx = this.x - x;
        var dy = this.y - y;
        return (Math.sqrt(dx * dx + dy * dy) - this.radius);
      }
    }

    this.stroke = function(ctx){
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
      ctx.stroke();
    }
  }



})();
