define([
	'shared/game/entity/Entity'
], function(
	Entity
) {
	function Square(id) {
		Entity.call(this, id, 'Square');
		this.speed = 5;
		this.x = 0;
		this.y = 0;
		this.moveX = 0;
		this.moveY = 0;
	}
	Square.prototype = Object.create(Entity.prototype);
	Square.prototype.update = function(actions) {
		//handle actions
		for(var i = 0; i < actions.length; i++) {
			if(actions[i].type === 'change-dir') {
				this.moveX = actions[i].moveX;
				this.moveY = actions[i].moveY;
			}
		}

		//move
		if(this.moveX > 0) {
			this.x += this.speed;
		}
		else if(this.moveX < 0) {
			this.x -= this.speed;
		}
		if(this.moveY > 0) {
			this.y += this.speed;
		}
		else if(this.moveY < 0) {
			this.y -= this.speed;
		}
	};
	Square.prototype.getState = function() {
		return {
			x: this.x,
			y: this.y,
			moveX: this.moveX,
			moveY: this.moveY
		};
	};
	Square.prototype.setState = function(state) {
		this.x = state.x;
		this.y = state.y;
		this.moveX = state.moveX;
		this.moveY = state.moveY;
	};
	Square.prototype.handleInput = function(key, isDown, state) {
		if(key === 'UP' || key === 'DOWN' || key === 'LEFT' || key === 'RIGHT') {
			var moveX = this.moveX;
			var moveY = this.moveY;
			if(key === 'UP') { moveY = isDown ? -1 : (state.DOWN ? 1 : 0); }
			else if(key === 'DOWN') { moveY = isDown ? 1 : (state.UP ? -1 : 0); }
			else if(key === 'LEFT') { moveX = isDown ? -1 : (state.RIGHT ? 1 : 0); }
			else if(key === 'RIGHT') { moveX = isDown ? 1 : (state.LEFT ? -1 : 0); }
			return [
				{
					type: 'entity-action',
					entityId: this.id,
					action: {
						type: 'change-dir',
						moveX: moveX,
						moveY: moveY
					}
				}
			];
		}
	};
	return Square;
});