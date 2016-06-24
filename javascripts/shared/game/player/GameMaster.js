define(function() {
	function GameMaster(params) {
		this.simulation = params.simulation;
		this._actions = [];
		//state variables
		this.nextEntityId = 0;
	}
	GameMaster.prototype.reset = function() {
		this._actions = [];
		for(var i = 0; i < 15; i++) {
			this._actions.push({
				type: 'spawn-entity',
				entityId: this.nextEntityId++,
				entityType: (Math.random() > 0.5 ? 'SyncedCrate' : 'DesyncedCrate'),
				entityState: {
					x: Math.round(100 + 400 * Math.random()),
					y: Math.round(100 + 200 * Math.random()),
					velX: 0,
					velY: 0
				}
			});
		}
	};
	GameMaster.prototype.update = function() {};
	GameMaster.prototype.addPlayer = function(player) {
		//spawn a new entity for that player to control
		var entityId = this.nextEntityId++;
		this._actions.push({
			type: 'spawn-entity',
			entityId: entityId,
			entityType: 'Square',
			entityState: {
				x: 300,
				y: 200,
				moveX: 0,
				moveY: 0
			}
		});
		//put the player in control of that entity
		player.join({
			entityId: entityId
		});
	};
	GameMaster.prototype.removePlayer = function(player) {
		//despawn the player's entity
		if(player.entityId !== null) {
			this._actions.push({
				type: 'despawn-entity',
				entityId: player.entityId
			});
		}
	};
	GameMaster.prototype.popActions = function() {
		var actions = this._actions;
		this._actions = [];
		return actions;
	};
	return GameMaster;
});