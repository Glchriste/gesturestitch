// Generated by CoffeeScript 1.6.1
(function() {
  var ImageDisplay_class, ImageMenu_class;

  if (typeof gs === "undefined" || gs === null) {
    window.gs = {};
  }

  Array.prototype.remove = function(e) {
    var t, _ref;
    if ((t = this.indexOf(e)) > -1) {
      return ([].splice.apply(this, [t, t - t + 1].concat(_ref = [])), _ref);
    }
  };

  ImageDisplay_class = (function() {

    function ImageDisplay_class() {
      this.box = $("#desktop");
      this.ubox = this.box[0];
      this.width = this.box.width();
      this.height = this.box.height();
      this.processImageList(['images/tigers.jpg', 'images/jumping_dad.jpg', 'images/jumping_kid.jpg', 'images/beach_left.jpg', 'images/beach_right.jpg', 'images/mountains_left.jpg', 'images/mountains_right.jpg']);
      $("#button-match").click(this.match.bind(this));
      this.selected_images = [];
    }

    ImageDisplay_class.prototype.processImageList = function(imlist) {
      var image, url, _i, _len, _results;
      this.image_list = [];
      _results = [];
      for (_i = 0, _len = imlist.length; _i < _len; _i++) {
        url = imlist[_i];
        _results.push(image = new gs.Image({
          url: url,
          parent: this
        }));
      }
      return _results;
    };

    ImageDisplay_class.prototype.exampleCanvas = function() {
      var im;
      im = gs.Image.all[0];
      im.brighten();
      return im.save();
    };

    ImageDisplay_class.prototype.select = function(image) {
      this.selected_images.push(image);
      if (this.selected_images.length === 3) {
        return this.selected_images[0].toggleSelect();
      }
    };

    ImageDisplay_class.prototype.deselect = function(image) {
      return this.selected_images.remove(image);
    };

    ImageDisplay_class.prototype.match = function() {
      var matches, translation;
      if (this.selected_images.length !== 2) {
        $("#status").text("Need two images to match.").dialog();
        return;
      }
      matches = this.selected_images[0].match(this.selected_images[1]);
      translation = this.selected_images[0].estimateTranslation(matches);
      $("#status").text("" + matches.length + " matches found, centered on " + translation);
      return this.selected_images[1].overlay(this.selected_images[0], new gs.Transform().translate(translation));
    };

    return ImageDisplay_class;

  })();

  ImageMenu_class = (function() {

    function ImageMenu_class() {
      this.menu = $("#image_menu").menu({
        select: $.proxy(this.select, this)
      });
      this.menu.mouseleave(function() {
        return $(this).hide();
      });
    }

    ImageMenu_class.prototype.show = function(image, event) {
      this.menu.css({
        top: event.pageY,
        left: event.pageX
      });
      this.menu.show();
      this.event = event;
      return this.image = image;
    };

    ImageMenu_class.prototype.select = function(event, ui) {
      var features;
      this.menu.hide();
      console.log("loading...");
      switch (ui.item.text()) {
        case "Brighten":
          return this.image.brighten();
        case "Delete":
          this.image.unlink();
          return gs.Image.all.remove(this.image);
        case "Features":
          features = this.image.features();
          this.image.renderFeatures(features);
          return $("<p>" + features.length + " features detected.</p>").dialog();
      }
    };

    return ImageMenu_class;

  })();

  $(function() {
    gs.ImageDisplay = new ImageDisplay_class();
    return gs.ImageMenu = new ImageMenu_class();
  });

}).call(this);
