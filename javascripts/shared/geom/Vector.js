define(function() {
	function Vector(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		this.x = x || 0;
		this.y = y || 0;
	}
	Vector.prototype.clone = function() {
		return new Vector(this.x, this.y);
	};
	Vector.prototype.copy = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		this.x = x;
		this.y = y;
		return this;
	};
	Vector.prototype.set = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		this.x = x;
		this.y = y;
		return this;
	};
	Vector.prototype.add = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		this.x += x;
		this.y += y;
		return this;
	};
	Vector.prototype.addMult = function(x, y, mult) {
		if(arguments.length === 2) { mult = y; y = x.y; x = x.x; }
		this.x += x * mult;
		this.y += y * mult;
		return this;
	};
	Vector.prototype.subtract = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		this.x -= x;
		this.y -= y;
		return this;
	};
	Vector.prototype.multiply = function(x, y) {
		if(arguments.length === 1) { y = x; }
		this.x *= x;
		this.y *= y;
		return this;
	};
	Vector.prototype.rotate = function(cosAngle, sinAngle) {
		if(arguments.length === 1) {
			sinAngle = Math.sin(cosAngle);
			cosAngle = Math.cos(cosAngle);
		}
		var x = this.x, y = this.y;
		this.x = x * cosAngle - y * sinAngle;
		this.y = x * sinAngle + y * cosAngle;
		return this;
	};
	Vector.prototype.unrotate = function(cosAngle, sinAngle) {
		if(arguments.length === 1) {
			sinAngle = Math.sin(cosAngle);
			cosAngle = Math.cos(cosAngle);
		}
		var x = this.x, y = this.y;
		this.x = x * cosAngle + y * sinAngle;
		this.y = -x * sinAngle + y * cosAngle;
		return this;
	};
	Vector.prototype.divide = function(x, y) {
		if(arguments.length === 1) { y = x; }
		this.x /= x;
		this.y /= y;
		return this;
	};
	Vector.prototype.zero = function() {
		this.x = 0;
		this.y = 0;
		return this;
	};
	Vector.prototype.isZero = function() {
		return this.x === 0 && this.y === 0;
	};
	Vector.prototype.squareLength = function() {
		return this.x * this.x + this.y * this.y;
	};
	Vector.prototype.length = function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	};
	Vector.prototype.setLength = function(newLen) {
		var len = Math.sqrt(this.x * this.x + this.y * this.y);
		if(len === 0) {
			this.x = 0;
			this.y = 0;
		}
		else {
			this.x *= newLen / len;
			this.y *= newLen / len;
		}
		return this;
	};
	Vector.prototype.createVectorTo = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		return new Vector(x - this.x, y - this.y);
	};
	Vector.prototype.normalize = function() {
		var len = Math.sqrt(this.x * this.x + this.y * this.y);
		if(len === 0) {
			this.x = 0;
			this.y = 0;
		}
		else {
			this.x /= len;
			this.y /= len;
		}
		return this;
	};
	Vector.prototype.average = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		this.x = (this.x + x) / 2;
		this.y = (this.y + y) / 2;
		return this;
	};
	Vector.prototype.dot = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		return this.x * x + this.y * y;
	};
	Vector.prototype.proj = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		var coeff = (this.x * x + this.y * y) / (x * x + y * y);
		this.x = coeff * x;
		this.y = coeff * y;
		return this;
	};
	Vector.prototype.angle = function() {
		return Math.atan2(this.y, this.x);
	};
	Vector.prototype.distance = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		var dx = this.x - x;
		var dy = this.y - y;
		return Math.sqrt(dx * dx + dy * dy);
	};
	Vector.prototype.squareDistance = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		var dx = this.x - x;
		var dy = this.y - y;
		return dx * dx + dy * dy;
	};
	Vector.prototype.equals = function(x, y) {
		if(arguments.length === 1) { y = x.y; x = x.x; }
		return this.x === x && this.y === y;
	};
	Vector.prototype.isZero = function() {
		return this.x === 0 && this.y === 0;
	};
	Vector.prototype.toString = function() {
		//for readability we reduce really small numbers to 0
		return 'x:' + (-0.0000000001 < this.x && this.x < 0.0000000001 ? 0 : Math.floor(100 * this.x) / 100) +
			', y:' + (-0.0000000001 < this.y && this.y < 0.0000000001 ? 0 : Math.floor(100 * this.y) / 100);
	};
	return Vector;
});