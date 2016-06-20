define(function() {
	function Player(params) {
		this.simulation = params.simulation;
		this.inputStream = params.inputStream;
		this._inputState = null;
		this._entityId = 7;//null; //TODO do not harcode
	}
	Player.prototype.reset = function(params) {
		this._entityId = params.entityId;
		var inputs = this.inputStream.popInputs();
		for(var i = 0; i < inputs.length; i++) {
			this._inputState = inputs[i].state;
		}
	};
	Player.prototype.popActions = function(frame) {
		var actions = [];
		var inputs = this.inputStream.popInputs(frame);
		var entity = this.simulation.getEntity(this._entityId);
		for(var i = 0; i < inputs.length; i++) {
			this._inputState = inputs[i].state;
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