define([
	'shared/game/entity/Square',
	'shared/game/entity/SyncedCrate',
	'shared/game/entity/DesyncedCrate'
], function(
	Square,
	SyncedCrate,
	DesyncedCrate
) {
	function Simulation() {
		this.entities = [];
	}
	Simulation.prototype.update = function(actions) {
		var i, j;

		//handle simulation-level actions
		for(i = 0; i < actions.length; i++) {
			if(actions[i].type === 'spawn-entity') {
				this.spawnEntity(actions[i].entityId, actions[i].entityType, actions[i].entityState);
			}
			else if(actions[i].type === 'despawn-entity') {
				this.despawnEntity(actions[i].entityId);
			}
		}

		//update all entities
		for(i = 0; i < this.entities.length; i++) {
			var actionsForEntity = [];
			for(j = 0; j < actions.length; j++) {
				if(actions[j].type === 'entity-action' && actions[j].entityId === this.entities[i].id) {
					actionsForEntity.push(actions[j].action);
				}
			}
			this.entities[i].update(actionsForEntity);
		}

		//check for hits on DesyncedCrates
		for(i = 0; i < this.entities.length; i++) {
			for(j = 0; j < this.entities.length; j++) {
				if(i !== j && this.entities[i].type === 'Square' &&
					this.entities[j].type === 'DesyncedCrate' &&
					this.entities[i].isAttacking() &&
					this.entities[i].isInAttackRange(this.entities[j])) {
					this.entities[j].push(4, this.entities[i].x, this.entities[i].y);
				}
			}
		}

		//states may be overwritten
		for(i = 0; i < actions.length; i++) {
			if(actions[i].type === 'set-entity-state') {
				this.getEntity(actions[i].entityId).setState(actions[i].entityState);
			}
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
			this.spawnEntity(state.entities[i].id, state.entities[i].type, state.entities[i].state);
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
	Simulation.prototype.spawnEntity = function(id, type, state) {
		this.despawnEntity(id);
		var entity;
		if(type === 'Square') {
			entity = new Square(id);
		}
		else if(type === 'SyncedCrate') {
			entity = new SyncedCrate(id);
		}
		else if(type === 'DesyncedCrate') {
			entity = new DesyncedCrate(id);
		}
		else {
			throw new Error('Cannot spawn entity of type "' + type + '"');
		}
		entity.setState(state);
		this.entities.push(entity);
	};
	Simulation.prototype.despawnEntity = function(id) {
		this.entities = this.entities.filter(function(entity) {
			return entity.id !== id;
		});
	};
	return Simulation;
});