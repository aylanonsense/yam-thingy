define([
	'shared/game/entity/Square'
], function(
	Square
) {
	function Simulation() {
		this.entities = [];
	}
	Simulation.prototype.update = function(actions) {
		for(var i = 0; i < this.entities.length; i++) {
			var actionsForEntity = [];
			for(var j = 0; j < actions.length; j++) {
				if(actions[j].type === 'entity-action' && actions[j].entityId === this.entities[i].id) {
					actionsForEntity.push(actions[j].action);
				}
			}
			this.entities[i].update(actionsForEntity);
		}
	};
	Simulation.prototype.getState = function() {
		var state = {
			entities: []
		};
		for(var i = 0; i < this.entities.length; i++) {
			state.entities.push({
				id: this.entities[i].id,
				type: this.entities[i].type,
				state: this.entities[i].getState()
			});
		}
		return state;
	};
	Simulation.prototype.setState = function(state) {
		this.entities = [];
		for(var i = 0; i < state.entities.length; i++) {
			var entity;
			if(state.entities[i].type === 'Square') {
				entity = new Square(state.entities[i].id);
				entity.setState(state.entities[i].state);
			}
			if(entity) {
				this.entities.push(entity);
			}
		}
	};
	Simulation.prototype.reset = function() {
		this.setState({
			entities: []
		});
	};
	Simulation.prototype.getEntity = function(id) {
		for(var i = 0; i < this.entities.length; i++) {
			if(this.entities[i].id === id) {
				return this.entities[i];
			}
		}
		return null;
	};
	return Simulation;
});