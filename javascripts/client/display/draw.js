define([
	'config',
	'display/canvas',
	'display/camera'
], function(
	config,
	canvas,
	camera
) {
	var DEFAULT_COLOR = '#fff';
	var DEFAULT_THICKNESS = 1;
	var DEFAULT_FONT = 'Arial';
	var DEFAULT_FONT_SIZE = 12;
	var DEFAULT_FONT_ALIGN = 'left';

	var ctx = canvas.getContext("2d");

	function applyDrawParams(params, defaultDrawMode) {
		var zoom, offsetX, offsetY;

		//fixed drawings will ignore the position of the camera
		if(params && params.fixed) {
			zoom = 1;
			offsetX = 0;
			offsetY = 0;
		}
		else {
			zoom = camera.zoom;
			offsetX = config.CANVAS_WIDTH / 2 - camera.pos.x * camera.zoom;
			offsetY = config.CANVAS_HEIGHT / 2 - camera.pos.y * camera.zoom;
		}

		var result = {
			shouldFill: false,
			shouldStroke: false,
			offset: { x: offsetX, y: offsetY },
			zoom: zoom
		};

		//figure out if we should stroke or fill
		if(!params || (!params.fill && !params.stroke && !params.color)) {
			if(defaultDrawMode === 'stroke') {
				result.shouldStroke = true;
				ctx.strokeStyle = DEFAULT_COLOR;
				ctx.lineWidth = zoom * (params && (params.thickness || params.thickness === 0) ? params.thickness : DEFAULT_THICKNESS);
			}
			else if(defaultDrawMode === 'fill') {
				result.shouldFill = true;
				ctx.fillStyle = DEFAULT_COLOR;
			}
		}
		else if(!params.fill && !params.stroke && params.color) {
			if(defaultDrawMode === 'stroke') {
				result.shouldStroke = true;
				ctx.strokeStyle = params.color;
				ctx.lineWidth = zoom * ((params.thickness || params.thickness === 0) ? params.thickness : DEFAULT_THICKNESS);
			}
			else if(defaultDrawMode === 'fill') {
				result.shouldFill = true;
				ctx.fillStyle = params.color;
			}
		}
		else {
			if(params.stroke) {
				result.shouldStroke = true;
				ctx.strokeStyle = params.stroke;
				ctx.lineWidth = zoom * ((params.thickness || params.thickness === 0) ? params.thickness : DEFAULT_THICKNESS);
			}
			if(params.fill) {
				result.shouldFill = true;
				ctx.fillStyle = params.fill;
			}
		}

		//return the results
		return result;
	}

	return {
		rect: function(x, y, width, height, params) {
			if(arguments.length <= 2) { params = y; height = x.height; width = x.width; y = x.y; x = x.x; }
			var result = applyDrawParams(params, 'fill');
			if(result.shouldFill) {
				ctx.fillRect(result.zoom * x + result.offset.x, result.zoom * y + result.offset.y,
					result.zoom * width, result.zoom * height);
			}
			if(result.shouldStroke) {
				ctx.strokeRect(result.zoom * x + result.offset.x, result.zoom * y + result.offset.y,
					result.zoom * width, result.zoom * height);
			}
		},
		circle: function(x, y, r, params) {
			var result = applyDrawParams(params, 'fill');
			ctx.beginPath();
			ctx.arc(result.zoom * x + result.offset.x, result.zoom * y + result.offset.y, result.zoom * r, 0, 2 * Math.PI);
			if(result.shouldFill) {
				ctx.fill();
			}
			if(result.shouldStroke) {
				ctx.stroke();
			}
		},
		line: function(x1, y1, x2, y2, params) {
			//(Vector, Vector) or (Vector, Vector, params)
			if(arguments.length < 4) {
				params = x2; y2 = y1.y; x2 = y1.x; y1 = x1.y; x1 = x1.x;
			}
			var result = applyDrawParams(params, 'stroke');
			if(result.shouldStroke) {
				ctx.beginPath();
				ctx.moveTo(result.zoom * x1 + result.offset.x, result.zoom * y1 + result.offset.y);
				ctx.lineTo(result.zoom * x2 + result.offset.x, result.zoom * y2 + result.offset.y);
				ctx.stroke();
			}
		},
		poly: function(/* x1, y1, x2, y2, ..., params */) {
			var params = (arguments.length % 2 === 0) ? {} : arguments[arguments.length - 1];
			var result = applyDrawParams(params, 'stroke');
			ctx.beginPath();
			ctx.moveTo(result.zoom * arguments[0] + result.offset.x, result.zoom * arguments[1] + result.offset.y);
			for(var i = 2; i < arguments.length - 1; i += 2) {
				ctx.lineTo(result.zoom * arguments[i] + result.offset.x, result.zoom * arguments[i + 1] + result.offset.y);
			}
			if(params && params.close) {
				ctx.closePath();
			}
			if(result.shouldFill) {
				ctx.fill();
			}
			if(result.shouldStroke) {
				ctx.stroke();
			}
		},
		text: function(txt, x, y, params) {
			var result = applyDrawParams(params, 'fill');
			ctx.font = (result.zoom * (params && params.fontSize || DEFAULT_FONT_SIZE)) + 'px ' +
				(params && params.font || DEFAULT_FONT);
			ctx.textAlign = params && params.align || DEFAULT_FONT_ALIGN;
			if(result.shouldFill) {
				ctx.fillText(txt, result.zoom * x + result.offset.x, result.zoom * y + result.offset.y);
			}
			if(result.shouldStroke) {
				ctx.strokeText(txt, result.zoom * x + result.offset.x, result.zoom * y + result.offset.y);
			}
		}
	};
});