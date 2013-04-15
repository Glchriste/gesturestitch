// Generated by CoffeeScript 1.6.1
(function() {

  gs.BoundsError = (function() {

    function BoundsError(message) {
      this.message = message;
    }

    BoundsError.prototype.toString = function() {
      return this.message;
    };

    return BoundsError;

  })();

  gs.Transform = (function() {

    function Transform(matrix) {
      var _ref;
      this.matrix = matrix;
      if ((_ref = this.matrix) == null) {
        this.matrix = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]];
      }
    }

    Transform.prototype.multiply = function(trans) {
      var adds, column_i, columns, part, row_i, rows, sum;
      rows = this.matrix.length;
      columns = trans.matrix[0].length;
      adds = this.matrix[0].length;
      if (this.matrix[0].length !== trans.matrix.length) {
        throw "Invalid size for matrix multiplication";
      }
      return new gs.Transform((function() {
        var _i, _results;
        _results = [];
        for (row_i = _i = 0; 0 <= rows ? _i < rows : _i > rows; row_i = 0 <= rows ? ++_i : --_i) {
          _results.push((function() {
            var _j, _k, _results1;
            _results1 = [];
            for (column_i = _j = 0; 0 <= columns ? _j < columns : _j > columns; column_i = 0 <= columns ? ++_j : --_j) {
              sum = 0;
              for (part = _k = 0; 0 <= adds ? _k < adds : _k > adds; part = 0 <= adds ? ++_k : --_k) {
                sum += this.matrix[row_i][part] * trans.matrix[part][column_i];
              }
              _results1.push(sum);
            }
            return _results1;
          }).call(this));
        }
        return _results;
      }).call(this));
    };

    Transform.prototype.coord = function(x, y) {
      return {
        x: this.matrix[0][0] * x + this.matrix[0][1] * y + this.matrix[0][2],
        y: this.matrix[1][0] * x + this.matrix[1][1] * y + this.matrix[1][2]
      };
    };

    Transform.prototype.getTranslation = function() {
      return {
        x: -this.matrix[0][2],
        y: -this.matrix[1][2]
      };
    };

    Transform.prototype.translate = function(point) {
      return new gs.Transform([[1, 0, -point.x | 0], [0, 1, -point.y | 0], [0, 0, 1]]).multiply(this);
    };

    Transform.prototype.rotate = function(radians) {
      return new gs.Transform([Math.cos(radians), Math.sin(radians), 0], [-Math.sin(radians), Math.cos(radians), 0], [0, 0, 1]).multiply(this);
    };

    Transform.prototype.scale = function(factor) {
      return new gs.Transform([[factor, 0, 0], [0, factor, 0], [0, 0, 1]]).multiply(this);
    };

    return Transform;

  })();

  gs.Pixels = (function() {

    function Pixels(args) {
      var _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
      this.channel = 4;
      this.offsetx = (_ref = args.x) != null ? _ref : 0;
      this.offsety = (_ref1 = args.y) != null ? _ref1 : 0;
      if (args.imdata != null) {
        this.imageData = args.imdata;
        this.width = this.imageData.width - this.offsetx;
        this.height = this.imageData.height - this.offsety;
        this.data = this.imageData.data;
        if (!((0 <= (_ref2 = this.offsetx) && _ref2 < this.imageData.width))) {
          throw new gs.BoundsError("Pixels() offset x " + this.offsetx + " out of bounds");
        }
        if (!((0 <= (_ref3 = this.offsety) && _ref3 < this.imageData.height))) {
          throw new gs.BoundsError("Pixels() offset y " + this.offsety + " out of bounds");
        }
        if (!((0 <= (_ref4 = this.offsetx + this.width) && _ref4 <= this.imageData.width))) {
          throw new gs.BoundsError("Pixels() width " + this.width + " out of bounds");
        }
        if (!((0 <= (_ref5 = this.offsety + this.height) && _ref5 <= this.imageData.height))) {
          throw new gs.BoundsError("Pixels() height " + this.height + " out of bounds");
        }
      } else {
        if (!((args.width != null) && (args.height != null))) {
          throw new gs.BoundsError("Must include width and height for bounds");
        }
        this.width = args.width;
        this.height = args.height;
        this.data = new Uint8ClampedArray(this.width * this.height * this.channel);
      }
    }

    Pixels.prototype.location = function(x, y) {
      var index;
      index = (y + this.offsety) * this.width;
      index += x + this.offsetx;
      index *= this.channel;
      return index;
    };

    Pixels.prototype.pixel = function(x, y, value) {
      var index;
      if (this.data == null) {
        throw "Missing data";
      }
      if (!((0 <= x && x < this.width))) {
        throw new gs.BoundsError("X " + x + " out of bounds");
      }
      if (!((0 <= y && y < this.height))) {
        throw new gs.BoundsError("Y " + y + " out of bounds");
      }
      index = this.location(x, y);
      return this._pixel(index, value);
    };

    Pixels.prototype._pixel = function(index, value) {
      if (value != null) {
        this.data.set(value, index);
        return value;
      } else {
        return this.data.subarray(index, index + this.channel);
      }
    };

    Pixels.prototype.iter = function(pt1, pt2) {
      var end, index, step, stride, stride_i;
      index = this.location(pt1.x, pt1.y);
      stride = (pt2.x - pt1.x) * this.channel;
      step = this.location(pt1.x, pt1.y + 1) - index;
      end = this.location(pt2.x, pt2.y);
      stride_i = 0;
      return function() {
        stride_i++;
        index++;
        if (stride_i === stride) {
          stride_i = 0;
          index += step;
        }
        if (index >= end) {
          return null;
        }
        return index;
      };
    };

    Pixels.prototype.box = function(x1, y1, x2, y2, value) {
      var box, cols, end, read_cursor, rows, start, step, stride, write_cursor, x, y, _i, _j;
      cols = x2 - x1;
      rows = y2 - y1;
      if (!((0 <= x1 && x1 < this.width) && (0 <= y1 && y1 < this.height))) {
        throw new gs.BoundsError("Box origin out of bounds: " + x1 + ", " + y1);
      }
      if (!((0 <= x2 && x2 < this.width) && (0 <= y2 && y2 < this.height))) {
        throw new gs.BoundsError("Box extent out of bounds: " + x2 + ", " + y2);
      }
      if (!((0 < cols && cols <= this.width))) {
        throw new gs.BoundsError("Box width out of bounds: " + cols);
      }
      if (!((0 < rows && rows <= this.height))) {
        throw new gs.BoundsError("Box height out of bounds: " + rows);
      }
      if (value != null) {
        start = this.location(pt1.x, pt1.y);
        stride = (pt2.x - pt1.x) * this.channel;
        step = this.location(pt1.x, pt1.y + 1) - index;
        end = this.location(pt2.x, pt2.y);
        read_cursor = start;
        write_cursor = 0;
        while (read_cursor < end) {
          value.data.set(this.data.subarray(read_cursor, read_cursor + stride), write_cursor);
          read_cursor += stride + step;
          write_cursor += stride;
        }
        return this;
      } else {
        box = new gs.Pixels({
          width: cols,
          height: rows
        });
        for (x = _i = x1; x1 <= x2 ? _i < x2 : _i > x2; x = x1 <= x2 ? ++_i : --_i) {
          for (y = _j = y1; y1 <= y2 ? _j < y2 : _j > y2; y = y1 <= y2 ? ++_j : --_j) {
            box.pixel(x - x1, y - y1, this.pixel(x, y));
          }
        }
        return box;
      }
    };

    Pixels.prototype.region = function(x, y, diameter) {
      startSpin();
      var left_top_margin, right_bottom_margin;
      left_top_margin = Math.floor(diameter / 2);
      right_bottom_margin = Math.ceil(diameter / 2);
      if (!((left_top_margin < x && x < (this.width - right_bottom_margin)))) {
        throw new gs.BoundsError("Region x dimension " + x + " too close to a bound");
      }
      if (!((left_top_margin < y && y < (this.height - right_bottom_margin)))) {
        throw new gs.BoundsError("Region y dimension " + y + " too close to a bound");
      }
      return this.box(x - left_top_margin, y - left_top_margin, x + right_bottom_margin, y + right_bottom_margin);
    };

    Pixels.prototype.merge = function(other, trans) {
      startSpin();
      var greatest_x, greatest_y, im2_coord, least_x, least_y, new_height, new_image, new_width, pvalue, shift, shift_x, shift_y, x, y, _i, _j, _k, _l, _ref, _ref1;
      shift = trans.getTranslation();
      greatest_x = Math.max(shift.x + other.width, this.width);
      least_x = Math.min(shift.x, 0);
      greatest_y = Math.max(shift.y + other.height, this.height);
      least_y = Math.min(shift.y, 0);
      new_width = greatest_x - least_x;
      new_height = greatest_y - least_y;
      shift_x = -least_x;
      shift_y = -least_y;
      trans = trans.translate({
        x: shift_x,
        y: shift_y
      });
      new_image = new gs.Pixels({
        width: new_width,
        height: new_height
      });
      for (x = _i = 0, _ref = this.width; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
        for (y = _j = 0, _ref1 = this.height; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; y = 0 <= _ref1 ? ++_j : --_j) {
          new_image.pixel(x + shift_x, y + shift_y, this.pixel(x, y));
        }
      }
      for (x = _k = 0; 0 <= new_width ? _k < new_width : _k > new_width; x = 0 <= new_width ? ++_k : --_k) {
        for (y = _l = 0; 0 <= new_height ? _l < new_height : _l > new_height; y = 0 <= new_height ? ++_l : --_l) {
          im2_coord = trans.coord(x, y);
          try {
            pvalue = other.pixel(im2_coord.x | 0, im2_coord.y | 0);
          } catch (err) {
            continue;
          }
          new_image.pixel(x, y, pvalue);
        }
      }
      return new_image;
    };

    Pixels.prototype.sse = function(other) {
      var err, i, other_pixel, sum, this_pixel, x, y, _i, _j, _k, _ref, _ref1;
      sum = 0;
      for (x = _i = 0, _ref = this.width; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
        for (y = _j = 0, _ref1 = this.height; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; y = 0 <= _ref1 ? ++_j : --_j) {
          this_pixel = this.pixel(x, y);
          other_pixel = other.pixel(x, y);
          for (i = _k = 0; _k < 4; i = ++_k) {
            err = this_pixel[i] - other_pixel[i];
            sum += err * err;
          }
        }
      }
      return sum;
    };

    Pixels.prototype.compareHistogram = function(other) {
      startSpin();
      var difference, error, i, my_histogram, other_histogram, x, y, _i, _j, _k, _ref, _ref1;
      my_histogram = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      other_histogram = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (x = _i = 0, _ref = this.width; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
        for (y = _j = 0, _ref1 = this.height; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; y = 0 <= _ref1 ? ++_j : --_j) {
          my_histogram[this.pixel(x, y)[0] / 16 | 0]++;
          other_histogram[other.pixel(x, y)[0] / 16 | 0]++;
        }
      }
      error = 0;
      for (i = _k = 0; _k < 16; i = ++_k) {
        difference = my_histogram[i] - other_histogram[i];
        difference *= difference;
        error += difference;
      }
      return error;
    };

    return Pixels;

  })();

}).call(this);
