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
    //run();
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
      console.log('mouse');
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
    iSprite.src = SU + '.sprites.png';
    iBg.src = 'bg.png';
    speed = SU/4;
  }//function onReady

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


})();
