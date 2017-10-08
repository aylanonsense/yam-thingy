define([
	'shared/game/entity/Entity',
	'shared/geom/Vector'
], function(
	Entity,
	Vector
) {
	function DesyncedCrate(id) {
		Entity.call(this, id, 'DesyncedCrate');
		this.width = 20;
		this.height = 20;
		//state variables
		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
	}
	DesyncedCrate.prototype = Object.create(Entity.prototype);
	DesyncedCrate.prototype.update = function(actions) {
		//decelerate
		this.velX *= 0.97;
		if(this.velX < 0.1 && this.velX > -0.1) {
			this.velX = 0;
		}
		this.velY *= 0.97;
		if(this.velY < 0.1 && this.velY > -0.1) {
			this.velY = 0;
		}

		//apply velocity
		this.x += this.velX;
		this.y += this.velY;

		// bounce off walls
		if (this.x < this.width / 2) {
			this.x = this.width / 2;
			if (this.velX < 0) {
				this.velX = -this.velX;
			}
		}
		if (this.y < this.height / 2) {
			this.y = this.height / 2;
			if (this.velY < 0) {
				this.velY = -this.velY;
			}
		}
		if (this.x > 600 - this.width / 2) {
			this.x = 600 - this.width / 2;
			if (this.velX > 0) {
				this.velX = -this.velX;
			}
		}
		if (this.y > 400 - this.height / 2) {
			this.y = 400 - this.height / 2;
			if (this.velY > 0) {
				this.velY = -this.velY;
			}
		}
	};
	DesyncedCrate.prototype.getState = function() {
		return this.getProperties([ 'x', 'y', 'velX', 'velY' ]);
	};
	DesyncedCrate.prototype.setState = function(state) {
		this.setProperties([ 'x', 'y', 'velX', 'velY' ], state);
	};
	DesyncedCrate.prototype.handleInput = function(key, isDown, state) {
		throw new Error('DesyncedCrate cannot be player controlled');
	};
	DesyncedCrate.prototype.push = function(speed, fromX, fromY) {
		var vec = new Vector(this.x, this.y);
		vec.subtract(fromX, fromY);
		if(vec.x !== 0 || vec.y !== 0) {
			vec.setLength(speed);
			this.velX = Math.round(vec.x);
			this.velY = Math.round(vec.y);
		}
	};
	DesyncedCrate.prototype.getErrorFromState = function(state) {
		return Math.abs(this.x - state.x) / 10 +
			Math.abs(this.y - state.y) / 10;
	};
	return DesyncedCrate;
});