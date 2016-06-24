define([
	'shared/game/entity/Entity'
], function(
	Entity
) {
	function DesyncedCrate(id) {
		Entity.call(this, id, 'DesyncedCrate');
		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
	}
	DesyncedCrate.prototype = Object.create(Entity.prototype);
	DesyncedCrate.prototype.update = function(actions) {
		//decelerate
		if(this.velX > 0) {
			this.velX = Math.max(0, this.velX - 1);
		}
		else if(this.velX < 0) {
			this.velX = Math.min(0, this.velX + 1);
		}
		if(this.velY > 0) {
			this.velY = Math.max(0, this.velY - 1);
		}
		else if(this.velY < 0) {
			this.velY = Math.min(0, this.velY + 1);
		}

		//apply velocity
		this.x += this.velX;
		this.y += this.velY;
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
	return DesyncedCrate;
});