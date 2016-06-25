define(function() {
	function Player(params) {
		this.simulation = params.simulation;
		this._actions = [];
		this._hasJoined = false;
		//state variables
		this.entityId = null;
	}
	Player.prototype.reset = function() {
		this._actions = [];
		this._hasJoined = false;
		this.setState({
			entityId: null
		});
	};
	Player.prototype.update = function(inputs) {
		var entity = this.simulation.getEntity(this.entityId);

		//for each recent input
		for(var i = 0; i < inputs.length; i++) {
			//let the entity's handleInput function determine what to do
			if(entity) {
				this._actions = this._actions.concat(entity.handleInput(inputs[i]));
			}
		}
	};
	Player.prototype.join = function(state) {
		this._hasJoined = true;
	};
	Player.prototype.getState = function() {
		return {
			entityId: this.entityId
		};
	};
	Player.prototype.setState = function(state) {
		this.entityId = state.entityId;
	};
	Player.prototype.popActions = function() {
		var actions = this._actions;
		this._actions = [];
		return actions;
	};
	Player.prototype.hasJoined = function() {
		return this._hasJoined;
	};
	return Player;
});