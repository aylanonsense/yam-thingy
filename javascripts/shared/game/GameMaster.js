define(function() {
	function GameMaster(params) {
		this.simulation = params.simulation;
	}
	GameMaster.prototype.popActions = function(frame) {
		var actions = [];
		if(frame % 30 === 0) {
			var entity = this.simulation.entities[0];
			actions.push({
				type: 'entity-action',
				entityId: entity.id,
				action: {
					type: 'change-dir',
					moveX: -entity.moveX,
					moveY: -entity.moveY
				}
			});
		}
		return actions;
	};
	return GameMaster;
});