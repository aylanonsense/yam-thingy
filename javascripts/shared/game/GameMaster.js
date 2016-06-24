define(function() {
	function GameMaster(params) {
		this.simulation = params.simulation;
		this._nextEntityId = 0;
		this._nextFrameActions = [];
	}
	GameMaster.prototype.addPlayer = function(player) {
		var entityId = this._nextEntityId++;
		this._nextFrameActions.push({
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
		player.setConfigParams({
			entityId: entityId
		});
	};
	GameMaster.prototype.removePlayer = function(player) {
		if(player.entityId !== null) {
			this._nextFrameActions.push({
				type: 'despawn-entity',
				entityId: player.entityId
			});
		}
	};
	GameMaster.prototype.generateInitialActions = function(frame) {
		this._nextFrameActions = [];
		var actions = [];
		for(var i = 0; i < 15; i++) {
			actions.push({
				type: 'spawn-entity',
				entityId: this._nextEntityId++,
				entityType: (Math.random() > 0.5 ? 'SyncedCrate' : 'DesyncedCrate'),
				entityState: {
					x: Math.round(100 + 400 * Math.random()),
					y: Math.round(100 + 200 * Math.random()),
					velX: 0,
					velY: 0
				}
			});
		}
		return actions;
	};
	GameMaster.prototype.generateActions = function(frame) {
		var actions = this._nextFrameActions;
		this._nextFrameActions = [];
		return actions;
	};
	return GameMaster;
});