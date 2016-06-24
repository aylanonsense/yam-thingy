define([
	'shared/game/entity/Entity'
], function(
	Entity
) {
	function SyncedCrate(id) {
		Entity.call(this, id, 'SyncedCrate');
		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
	}
	SyncedCrate.prototype = Object.create(Entity.prototype);
	SyncedCrate.prototype.update = function(actions) {
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
	SyncedCrate.prototype.getState = function() {
		return this.getProperties([ 'x', 'y', 'velX', 'velY' ]);
	};
	SyncedCrate.prototype.setState = function(state) {
		this.setProperties([ 'x', 'y', 'velX', 'velY' ], state);
	};
	SyncedCrate.prototype.handleInput = function(key, isDown, state) {
		throw new Error('SyncedCrate cannot be player controlled');
	};
	return SyncedCrate;
});