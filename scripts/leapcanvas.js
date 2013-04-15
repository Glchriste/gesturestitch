var LeapEx = {
  //Useful variables.
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

  //Initialize the app.
  init: function(el, debugEl) {

    //JQuery Stuff
    LeapEx.el = $(el);
    LeapEx.debugEl = $(debugEl);

    // Support both the WebSocket and MozWebSocket objects
    if ((typeof(WebSocket) == 'undefined') &&
        (typeof(MozWebSocket) != 'undefined')) {
      WebSocket = MozWebSocket;
    }

    //Window width and height.
    var w = LeapEx.width = $(window).width();
    var h = LeapEx.height = $(window).height();
    $(el).attr('width', w).css('width', w).attr('height', h).css('height', h);
    $(el).css('position', 'absolute').css('left', '0').css('top', '0');

    //Grab a starting image for when Leap interaction starts.
    var pic = gs.Image.all[1];
    var im = pic.image.offset();
    var x1 = im.left;
    var y1 = im.top;

    //Setup up the 2D context
    LeapEx.ctx = $(el)[0].getContext("2d");
    LeapEx.ws = new WebSocket("ws://localhost:6437/");

    //Setup the Leap functions...
    
    //On connection
    LeapEx.ws.onopen = function(event) {
      LeapEx.debug("WebSocket connection open!");
      LeapEx.ws.send(JSON.stringify({enableGestures: true}));
    };
    //On close
    LeapEx.ws.onclose = function(event) {
      LeapEx.ws = null;
      LeapEx.debug("WebSocket connection closed");
    };
    //On error
    LeapEx.ws.onerror = function(event) {
      LeapEx.debug("Received error");
    };
    
    //Setup variables.
    var selection = 1;
    var selection2 = 2;
    var previousFrame = null;
    var gesture = "";
    var previousSelection = null;
    var previousSelection2 = null;
    var matches = 0;
    
    //When the Leap receives a new frame, get the data.
    LeapEx.ws.onmessage = function(event) {
    var selectionCounter = 0;
    var selectionCounter2 = 0;

      if (LeapEx.started) {
        var obj = JSON.parse(event.data);
        var str = JSON.stringify(obj, undefined, 2);
        var frame = obj;
        LeapEx.debug(str);

        //If there are hands, start checking for gestures...
        if (typeof(obj.hands) != 'undefined' && obj.hands.length > 0) {
          var targets = [];

          //Get palm vectors
          for (var i=0; i<obj.hands.length; i++) {
            var hand = obj.hands[i];
            var x = hand.palmPosition[0];
            var y = hand.palmPosition[1];
            var z = hand.palmPosition[2];

            if (z < 10) { z = 10; }
            targets.push({ 'x': x, 'y': y, 'z': z });
          }

          //Get Leap cursor position. 2D screen-projection of 3D ray coming from the center of the palm
          LX = LeapEx.scale(obj.hands[0].palmPosition[0], LeapEx.leapMinX, LeapEx.leapMaxX, -100, LeapEx.width);
          LY = LeapEx.scale(obj.hands[0].palmPosition[1], LeapEx.leapMinY, LeapEx.leapMaxY, LeapEx.height, -100);
          
          LX = LX - 100;
          LY = LY - 100;

         //Draw new cursor.
         LeapEx.draw(targets);
         
         //Setup images.
         if(selection2 !== null) {
          gs.Image.all[selection2].setupCanvas();
         }
         if(selection !== null) {
          gs.Image.all[selection].setupCanvas();
         }

         //Get height and width of images.
         var width = gs.Image.all[selection].width;
         var height = gs.Image.all[selection].height;

          // Display Gesture object data if needed. For testing purposes.
          var gestureString = "";
          if (frame.gestures.length > 0) {
            for (var i = 0; i < frame.gestures.length; i++) {
              var gesture = frame.gestures[i];
              gestureString += "Gesture ID: " + gesture.id + ", "
                            + "type: " + gesture.type + ", "
                            + "state: " + gesture.state + ", "
                            + "hand IDs: " + gesture.handIds.join(", ") + ", "
                            + "pointable IDs: " + gesture.pointableIds.join(", ") + ", "
                            + "duration: " + gesture.duration + " &micro;s, ";

              switch (gesture.type) {
                case "circle":
                  gesture = "circle";
                  gestureString += "center: " + (gesture.center) + " mm, "
                                + "normal: " + (gesture.normal, 2) + ", "
                                + "radius: " + gesture.radius + " mm, "
                                + "progress: " + gesture.progress + " rotations";
                  break;
                case "swipe":
                  gesture = "swipe";
                  gestureString += "start position: " + (gesture.startPosition) + " mm, "
                                + "current position: " + (gesture.position) + " mm, "
                                + "direction: " + (gesture.direction, 2) + ", "
                                + "speed: " + gesture.speed + " mm/s";
                  break;
                case "screenTap":
                case "keyTap":
                  gesture = "Tap";
                  gestureString += "position: " + (gesture.position) + " mm, "
                                + "direction: " + (gesture.direction, 2);
                  break;
                default:
                  gestureString += "unkown gesture type";
              }
            }
          }

         //Get data from the last frame to compare to the current frame to see if a gesture happened.
         if(previousFrame != null && frame.gestures.length == 1) {
           if(previousFrame.gestures.length == 0) {
             console.log("Gesture happened: " + gesture);
             switch(gesture) {
              case "circle":
                console.log("Changing selection");
                
                //Scenarios to switch image selection. When a swipe or circle gesture occurs.     
                if(frame.hands.length == 1) {
                  previousSelection = selection;
                  if(selectionCounter >= 2) {
                  gs.Image.all[previousSelection].wrapper.removeClass("ui-selected");
                  gs.Image.all[previousSelection].parent.deselect(gs.Image.all[previousSelection]);
                  selectionCounter--;
                }
                  
                  if(selection < 6) {
                    selection++;
                  } else {
                    selection = 0;
                  }
                if(!gs.Image.all[selection].wrapper.hasClass("ui-selected")) {
                      gs.Image.all[selection].wrapper.addClass("ui-selected");
                      gs.Image.all[selection].parent.select(gs.Image.all[selection]);
                      selectionCounter++;
              }
                } else {
                  previousSelection2 = selection2;
                  if(selectionCounter2 >= 2) {
                  gs.Image.all[previousSelection2].wrapper.removeClass("ui-selected");
                  gs.Image.all[previousSelection2].parent.deselect(gs.Image.all[previousSelection2]);
                  selectionCounter2--;
                }
                  
                  if(selection2 < 6) {
                    selection2 = Math.floor(Math.random()*8);
                    while(selection2 == selection) {
                      selection2 = Math.floor(Math.random()*8);
                    }
                  } else {
                    selection2 = 0;
                  }
                  if(!gs.Image.all[selection2].wrapper.hasClass("ui-selected")) {
                    gs.Image.all[selection2].wrapper.addClass("ui-selected");
                    gs.Image.all[selection2].parent.select(gs.Image.all[selection2]);
                    selectionCounter2++;
                  }
                }
                console.log('Selected image #' + selection);
                break;
             }
           }
         }
         //If one semi-open hand, move first image-selection.
         if(obj.pointables.length >= 3 && obj.pointables.length < 5 && obj.hands.length == 1) {
            //Draw new cursor
            LeapEx.draw(targets);
            //Place first image selected near cursor
            gs.Image.all[selection].place(LX, LY);
            if(!gs.Image.all[selection].wrapper.hasClass("ui-selected")) {
            gs.Image.all[selection].wrapper.addClass("ui-selected");
            gs.Image.all[selection].parent.select(gs.Image.all[selection]);
           } else {
              
           }
          }
          //If two hands and index finger pointing with left hand open, move second image-selection.
          else if(obj.pointables.length >= 5 && obj.hands.length == 2) {
              //Draw new cursor
              LeapEx.draw(targets);
              //Place second image selected near cursor
              gs.Image.all[selection2].place(LX, LY);
              if(!gs.Image.all[selection2].wrapper.hasClass("ui-selected")) {
              gs.Image.all[selection2].wrapper.addClass("ui-selected");
              gs.Image.all[selection2].parent.select(gs.Image.all[selection2]);
             }
          }
          //Merge gesture. Two fists.
          else if(obj.pointables.length == 0 && obj.hands.length == 2 && matches == 0) {

            //Draw new cursor
            //LeapEx.draw(targets);
            //Error prevention for presenting smoothly.
            switch(selection) {
              case 1: selection2 = 2; break;
              case 2: selection = 1; selection2 = 2; break;
              case 3: selection2 = 4; break;
              case 4: selection = 3; selection2 = 4; break;
              case 5: selection2 = 6; break;
              case 6: selection = 5; selection2 = 6; break; 
            }
            //Merging the selected images
            //if(spinner === undefined) {

              var matchset = gs.Image.all[selection2].match(gs.Image.all[selection]);
              var translation = gs.Image.all[selection2].estimateTranslation(matchset);
              console.log(translation);
              var merged = gs.Image.all[selection].overlay(gs.Image.all[selection2], new gs.Transform().translate(translation));
              console.log(merged);
              matches = matches + 1;
            //}
            stopSpin();
            
          }
          else {
            //Do nothing
          }
          gesture = "";
          previousFrame = frame;
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
         } while (obj == obj.offsetParent);

      return {X:curleft,Y:curtop};
    }
  },

  draw: function(targets) {

    LeapEx.ctx.clearRect(0, 0, LeapEx.width, LeapEx.height);
    
    for (var i=0; i<targets.length; i++) {
      //LeapEx.ctx.clearRect(0, 0, LeapEx.width, LeapEx.height);
      LeapEx.ctx.beginPath();
      var target = targets[i];
      LeapEx.ctx.arc(LeapEx.scale(target.x, LeapEx.leapMinX, LeapEx.leapMaxX, -100, LeapEx.width),
                     LeapEx.scale(target.y, LeapEx.leapMinY, LeapEx.leapMaxY, LeapEx.height, -100),
                     10, 0, Math.PI*2, true);
      LeapEx.ctx.closePath();
      LeapEx.ctx.globalAlpha = 0.5;
      LeapEx.ctx.fillStyle = "green";
      LeapEx.ctx.fill();
      LeapEx.ctx.lineWidth = 5;
      LeapEx.ctx.strokeStyle = '#003300';
      LeapEx.ctx.beginPath();
      LeapEx.ctx.stroke();
      LeapEx.ctx.closePath();
      //LeapEx.ctx.globalCompositeOperation = 'source-over';
      
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
