define([
	'shared/game/entity/Entity'
], function(
	Entity
) {
	var STATE_VARIABLES = [ 'x', 'y', 'moveX', 'moveY', 'framesUntilNextAttack', 'framesOfAttackLeft' ];

	function Square(id) {
		Entity.call(this, id, 'Square');
		this.width = 20;
		this.height = 20;
		this.attackRange = 60;
		this.speed = 5;
		this.attackDuration = 5;
		this.framesBetweenAttacks = 30;
		//state variables
		this.x = 0;
		this.y = 0;
		this.moveX = 0;
		this.moveY = 0;
		this.framesUntilNextAttack = 0;
		this.framesOfAttackLeft = 0;
	}
	Square.prototype = Object.create(Entity.prototype);
	Square.prototype.update = function(actions) {
		//increment/decrement counters
		if(this.framesUntilNextAttack > 0) {
			this.framesUntilNextAttack--;
		}
		if(this.framesOfAttackLeft > 0) {
			this.framesOfAttackLeft--;
		}
		//handle actions
		for(var i = 0; i < actions.length; i++) {
			var action = actions[i];
			if(action.type === 'change-move-dir') {
				if(action.moveX !== null) {
					this.moveX = action.moveX;
				}
				if(action.moveY !== null) {
					this.moveY = action.moveY;
				}
			}
			else if(action.type === 'attack') {
				this.framesUntilNextAttack = this.framesBetweenAttacks + 1;
				this.framesOfAttackLeft = this.attackDuration;
			}
		}
		//move
		if(this.moveX > 0) { this.x += this.speed; }
		else if(this.moveX < 0) { this.x -= this.speed; }
		if(this.moveY > 0) { this.y += this.speed; }
		else if(this.moveY < 0) { this.y -= this.speed; }
	};
	Square.prototype.getState = function() {
		return this.getProperties(STATE_VARIABLES);
	};
	Square.prototype.setState = function(state) {
		this.setProperties(STATE_VARIABLES, state);
	};
	Square.prototype.handleInput = function(input) {
		var actions = [];
		if(input.type === 'keyboard') {
			var key = input.key;
			var isDown = input.isDown;
			var state = input.state;
			if(key === 'UP' || key === 'DOWN' || key === 'LEFT' || key === 'RIGHT') {
				var moveX = null;
				var moveY = null;
				if(key === 'UP') { moveY = isDown ? -1 : (state.DOWN ? 1 : 0); }
				else if(key === 'DOWN') { moveY = isDown ? 1 : (state.UP ? -1 : 0); }
				else if(key === 'LEFT') { moveX = isDown ? -1 : (state.RIGHT ? 1 : 0); }
				else if(key === 'RIGHT') { moveX = isDown ? 1 : (state.LEFT ? -1 : 0); }
				actions.push({
					type: 'entity-action',
					entityId: this.id,
					action: {
						type: 'change-move-dir',
						moveX: moveX,
						moveY: moveY
					}
				});
			}
			else if(key === 'USE') {
				if(isDown && this.framesUntilNextAttack <= 0) {
					actions.push({
						type: 'entity-action',
						entityId: this.id,
						action: {
							type: 'attack'
						}
					});
				}
			}
		}
		return actions;
	};
	Square.prototype.isAttacking = function() {
		return this.framesOfAttackLeft === this.attackDuration;
	};
	Square.prototype.isInAttackRange = function(other) {
		var dx = Math.abs(this.x - other.x) - other.width / 2;
		var dy = Math.abs(this.y - other.y) - other.height / 2;
		return dx <= this.attackRange / 2 && dy <= this.attackRange / 2;
	};
	return Square;
});