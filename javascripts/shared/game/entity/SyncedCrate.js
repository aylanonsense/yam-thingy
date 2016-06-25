define([
	'shared/game/entity/Entity',
	'shared/geom/Vector'
], function(
	Entity,
	Vector
) {
	function SyncedCrate(id) {
		Entity.call(this, id, 'SyncedCrate');
		this.width = 20;
		this.height = 20;
		//state variables
		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
	}
	SyncedCrate.prototype = Object.create(Entity.prototype);
	SyncedCrate.prototype.update = function(actions) {
		for(var i = 0; i < actions.length; i++) {
			if(actions[i].type === 'push') {
				this.push(actions[i].speed, actions[i].fromX, actions[i].fromY);
			}
		}

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
	};
	SyncedCrate.prototype.getState = function() {
		return this.getProperties([ 'x', 'y', 'velX', 'velY' ]);
	};
	SyncedCrate.prototype.setState = function(state) {
		this.setProperties([ 'x', 'y', 'velX', 'velY' ], state);
	};
	SyncedCrate.prototype.handleInput = function(key, isDown, state) {
		throw new Error('SyncedCrate cannot be player controlled');
	};
	SyncedCrate.prototype.push = function(speed, fromX, fromY) {
		var vec = new Vector(this.x, this.y);
		vec.subtract(fromX, fromY).setLength(speed);
		this.velX = Math.round(vec.x);
		this.velY = Math.round(vec.y);
	};
	return SyncedCrate;
});