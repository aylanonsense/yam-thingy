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
			if(actions[i].type === 'change-move-dir') {
				if(actions[i].moveX !== null) {
					this.moveX = actions[i].moveX;
				}
				if(actions[i].moveY !== null) {
					this.moveY = actions[i].moveY;
				}
			}
		}
		//move
		if(this.moveX > 0) { this.x += this.speed; }
		else if(this.moveX < 0) { this.x -= this.speed; }
		if(this.moveY > 0) { this.y += this.speed; }
		else if(this.moveY < 0) { this.y -= this.speed; }
	};
	Square.prototype.getState = function() {
		return this.getProperties([ 'x', 'y', 'moveX', 'moveY' ]);
	};
	Square.prototype.setState = function(state) {
		this.setProperties([ 'x', 'y', 'moveX', 'moveY' ], state);
	};
	Square.prototype.handleInput = function(input) {
		if(input.key === 'UP' || input.key === 'DOWN' || input.key === 'LEFT' || input.key === 'RIGHT') {
			var moveX = null;
			var moveY = null;
			if(input.key === 'UP') { moveY = input.isDown ? -1 : (input.state.DOWN ? 1 : 0); }
			else if(input.key === 'DOWN') { moveY = input.isDown ? 1 : (input.state.UP ? -1 : 0); }
			else if(input.key === 'LEFT') { moveX = input.isDown ? -1 : (input.state.RIGHT ? 1 : 0); }
			else if(input.key === 'RIGHT') { moveX = input.isDown ? 1 : (input.state.LEFT ? -1 : 0); }
			return [
				{
					type: 'entity-action',
					entityId: this.id,
					action: {
						type: 'change-move-dir',
						moveX: moveX,
						moveY: moveY
					}
				}
			];
		}
	};
	return Square;
});