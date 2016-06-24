define(function() {
	function Player(params) {
		this.simulation = params.simulation;
		this.inputStream = params.inputStream;
		this.entityId = null;
	}
	Player.prototype.reset = function() {
		this.entityId = null;
	};
	Player.prototype.getConfigParams = function() {
		return {
			entityId: this.entityId
		};
	};
	Player.prototype.setConfigParams = function(params) {
		this.entityId = params.entityId;
	};
	Player.prototype.generateActions = function(frame) {
		var actions = [];
		var entity = this.simulation.getEntity(this.entityId);

		//for each recent input
		var inputs = this.inputStream.popInputs(frame);
		for(var i = 0; i < inputs.length; i++) {
			//let the entity's handleInput function determine what to do
			if(entity) {
				var entityGeneratedActions = entity.handleInput(inputs[i].key, inputs[i].isDown, inputs[i].state);
				if(entityGeneratedActions) {
					actions = actions.concat(entityGeneratedActions);
				}
			}
		}
		return actions;
	};
	return Player;
});