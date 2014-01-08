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

    //enableInputs();
    //setDensity();
    //resize();
    //onReady();
    //run();
  }


})();
