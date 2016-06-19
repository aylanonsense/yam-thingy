define([
	'config',
	'display/draw'
], function(
	config,
	draw
) {
	function ConsoleUI() {
		this._lines = [];
	}
	ConsoleUI.prototype.write = function(line) {
		this._lines.push(line);
	};
	ConsoleUI.prototype.clear = function() {
		this._lines = [];
	};
	ConsoleUI.prototype.render = function() {
		var margin = 20;
		var lineHeight = 20;
		var maxLines = Math.floor((config.CANVAS_HEIGHT - 2 * margin) / lineHeight);
		var topmostLineIndex = Math.max(0, this._lines.length - maxLines);
		for(var i = topmostLineIndex; i < topmostLineIndex + maxLines && i < this._lines.length; i++) {
			draw.text(this._lines[i], margin, margin + lineHeight * (i - topmostLineIndex) + 16, { fill: '#fff', fontSize: 16, fixed: true });
		}
	};
	return new ConsoleUI();
});