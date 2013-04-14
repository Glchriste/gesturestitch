var LeapEx = {
  ws: null,
  ctx: null,
  width: null,
  height: null,
  debugEl: null,
  el: null,
  leapMinX: -200,
  leapMaxX: 200,
  leapMinY: 100,
  leapMaxY: 600,
  leapMinZ: -180,
  leapMaxZ: 180,
  started: false,

  init: function(el, debugEl) {

    LeapEx.el = $(el);
    LeapEx.debugEl = $(debugEl);

    // Support both the WebSocket and MozWebSocket objects
    if ((typeof(WebSocket) == 'undefined') &&
        (typeof(MozWebSocket) != 'undefined')) {
      WebSocket = MozWebSocket;
    }

    var w = LeapEx.width = $(window).width();
    var h = LeapEx.height = $(window).height();
    $(el).attr('width', w).css('width', w).attr('height', h).css('height', h);
    $(el).css('position', 'absolute').css('left', '0').css('top', '0');

      var pic = gs.Image.all[1];
      var im = pic.image.offset();
      console.log(im);
      var x1 = im.left;
      var y1 = im.top;
      var startX = im.left;
      var startY = im.top;
      var imW = gs.Image.all[1].image.width();
      var imH = gs.Image.all[1].image.height();
      var x2 = x1 + imW;
      var y2 = y1 + imH;
      var xCenter = (x1 + x2)/2;
      var yCenter = (y1 + y2)/2;
      var matches = 0;
      var pic_2 = gs.Image.all[1];
      var im_2 = pic_2.image.offset();
      var x1_2 = im.left;
      var y1_2 = im.top;
      var startX_2 = im.left;
      var startY_2 = im.top;
      var x2_2 = x1 + pic_2.image.width();
      var y2_2 = y1 + pic_2.image.height();
      var xCenter_2 = (x1 + x2)/2;
      var yCenter_2 = (y1 + y2)/2;
      var imW_2 = gs.Image.all[2].image.width();
      var imH_2 = gs.Image.all[2].image.height();

    LeapEx.ctx = $(el)[0].getContext("2d");
    LeapEx.ws = new WebSocket("ws://localhost:6437/");

    LeapEx.ws.onopen = function(event) {
      LeapEx.debug("WebSocket connection open!");
    };

    LeapEx.ws.onclose = function(event) {
      LeapEx.ws = null;
      LeapEx.debug("WebSocket connection closed");
    };

    LeapEx.ws.onerror = function(event) {
      LeapEx.debug("Received error");
    };
    
    var hovering = false;
    var offset = gs.Image.all[1].image.offset();
    offset.left = startX;
    offset.top = startY;
    LeapEx.ws.onmessage = function(event) {

      if (LeapEx.started) {
        var obj = JSON.parse(event.data);
        var str = JSON.stringify(obj, undefined, 2);

        LeapEx.debug(str);

        if (typeof(obj.hands) != 'undefined' && obj.hands.length > 0) {
          var targets = [];

          // for (var i=0; i<obj.hands.length; i++) {
          //   var hand = obj.hands[i];
          //   var x = hand.palmPosition[0];
          //   var y = hand.palmPosition[1];
          //   var z = hand.palmPosition[2];

          //   if (z < 10) { z = 10; }
          //   targets.push({ 'x': x, 'y': y, 'z': z });
          // }
            var hand = obj.hands[0];
            var x = hand.palmPosition[0];
            var y = hand.palmPosition[1];
            var z = hand.palmPosition[2];

            if (z < 10) { z = 10; }
            targets.push({ 'x': x, 'y': y, 'z': z });

          LX = LeapEx.scale(obj.hands[0].palmPosition[0], LeapEx.leapMinX, LeapEx.leapMaxX, -100, LeapEx.width);
          LY = LeapEx.scale(obj.hands[0].palmPosition[1], LeapEx.leapMinY, LeapEx.leapMaxY, LeapEx.height, -100);
          
          LX = LX - 200;
          LY = LY - 200;

         //console.log('Pointing Coords: ' + LX + ', ' + LY);
         gs.Image.all[2].setupCanvas();
         gs.Image.all[1].setupCanvas();
         var width = gs.Image.all[2].width;
         var height = gs.Image.all[2].height;
         if(matches == 0) { LeapEx.draw(targets); }
         //If one finger, move left half of image
         if(obj.pointables.length == 1 && obj.hands.length == 1) {
          
          if(matches == 0) { hovering = true; }
            if(LX >= x1 && LX <= (x1+width) && LY >= y1 && LY <= (y2+height)) {
              console.log('INTERSECTION');
           }
            gs.Image.all[1].place(LX, LY);
            locX = Math.abs(LX);
            locY = Math.abs(LY);
            offset.left = locX;
            offset.top = locY;
            gs.Image.all[1].image.offset = offset;
            //console.log(gs.Image.all[1].image.offset.left + ', ' + offset.top);
            if(!gs.Image.all[1].wrapper.hasClass("ui-selected")) {
            gs.Image.all[1].wrapper.addClass("ui-selected");
            gs.Image.all[1].parent.select(gs.Image.all[1]);
           }
          }
          //If Two hands and index finger pointing with left hand open, move right half of image.
          else if(obj.pointables.length <= 6 && obj.pointables.length > 4 && obj.hands.length == 2) {

              if(matches == 0) { hovering = true; }
              gs.Image.all[2].place(LX, LY);
            
              locX = Math.abs(LX);
              locY = Math.abs(LY);
              offset.left = locX;
              offset.top = locY;
              gs.Image.all[2].image.offset = offset;

              if(!gs.Image.all[2].wrapper.hasClass("ui-selected")) {
              gs.Image.all[2].wrapper.addClass("ui-selected");
              gs.Image.all[2].parent.select(gs.Image.all[1]);
             }
          }
          //Merge gesture. Two fists.
          else if(obj.pointables.length == 0 && obj.hands.length == 2 && matches == 0) {
            var matchset = gs.Image.all[2].match(gs.Image.all[1]);
            var translation = gs.Image.all[2].estimateTranslation(matchset);
            console.log(translation);
            var merged = gs.Image.all[1].overlay(gs.Image.all[2], new gs.Transform().translate(translation));
            console.log(merged);
            matches = matches + 1;
            hovering = false;
            LeapEx.ctx.clearRect(0, 0, LeapEx.width, LeapEx.height);
          }
          else{
            if(hovering == false) {
              gs.Image.all[1].wrapper.removeClass("ui-selected");
              gs.Image.all[1].parent.deselect(gs.Image.all[1]);
              gs.Image.all[2].wrapper.removeClass("ui-selected");
              gs.Image.all[2].parent.deselect(gs.Image.all[2]);
              LeapEx.ctx.clearRect(0, 0, LeapEx.width, LeapEx.height);
           }
          }
        
        }
      }
    };

    // $(document.body).click(function() {
    //   LeapEx.toggle();
    // });

    LeapEx.started = true;
    return LeapEx.el;
  },

  findPos: function (obj){
  var curleft = 0;
  var curtop = 0;

  if (obj.offsetParent) {
      do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
         } while (obj = obj.offsetParent);

      return {X:curleft,Y:curtop};
    }
  },

  draw: function(targets) {
    LeapEx.ctx.clearRect(0, 0, LeapEx.width, LeapEx.height);
    LeapEx.ctx.beginPath();
    for (var i=0; i<targets.length; i++) {
      var target = targets[i];
      LeapEx.ctx.arc(LeapEx.scale(target.x, LeapEx.leapMinX, LeapEx.leapMaxX, -100, LeapEx.width),
                     LeapEx.scale(target.y, LeapEx.leapMinY, LeapEx.leapMaxY, LeapEx.height, -100),
                     10, 0, Math.PI*2, true);
      LeapEx.ctx.closePath();
      LeapEx.ctx.fillStyle = "white";
      LeapEx.ctx.fill();
      //LeapEx.ctx.lineWidth = 5;
      //LeapEx.ctx.strokeStyle = '#003300';
      //LeapEx.ctx.stroke();
    }
  },

  intersects: function(images) {
    //Todo: Check if the leap cursor intersects an image
  },

  scale: function(value, oldMin, oldMax, newMin, newMax) {
    return (((newMax - newMin) * (value - oldMin)) / (oldMax - oldMin)) + newMin;
  },

  toggle: function() {
    if (LeapEx.started) {
      LeapEx.started = false;
    } else {
      LeapEx.started = true;
    }
  },

  debug: function(message) {
    if (LeapEx.debugEl) {
      LeapEx.debugEl.text(message);
    }
  }
};
