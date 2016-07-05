define([
	'shared/time/clock'
], function(
	clock
) {
	function SimulationSyncer(params) {
		this.simulationRunner = params.simulationRunner;
		this.predictionSimulationRunner = params.predictionSimulationRunner;
		this.latencySyncer = params.latencySyncer;
		this._errorPerEntity = {};
		this._revisions = [];
	}
	SimulationSyncer.prototype.reset = function() {
		this._errorPerEntity = {};
		this._revisions = [];
	};
	SimulationSyncer.prototype.update = function() {
		var delay = this.latencySyncer.latency - this.latencySyncer.inputLatency;
		var oldPredictionState = this.predictionSimulationRunner.getStateAt(clock.frame - delay);
		if(oldPredictionState) {
			for(var i = 0; i < this.simulationRunner.simulation.entities.length; i++) {
				//get each entity on the server and its corresponding client entity
				var entity = this.simulationRunner.simulation.entities[i];
				var predictionEntity = this.predictionSimulationRunner.simulation.getEntity(entity.id);
				if(!this._errorPerEntity[entity.id]) {
					this._errorPerEntity[entity.id] = 0;
				}
				if(!predictionEntity) {
					console.warn('Entity id ' + entity.id + ' exists on server but not client');
				}
				else {
					//also get the state of the client from a couple of moments ago
					var currEntityState = predictionEntity.getState();
					var prevEntityState = null;
					for(var j = 0; j < oldPredictionState.entities.length; j++) {
						if(oldPredictionState.entities[j].id === entity.id) {
							prevEntityState = oldPredictionState.entities[j].state;
							break;
						}
					}
					if(!prevEntityState) {
						//server has an entity the client does not have historical data for
					}
					else {
						//if the error between the server and client states builds up too much, we need to revise it
						var currErr = entity.getErrorFromState(currEntityState);
						var prevErr = entity.getErrorFromState(prevEntityState);
						this._errorPerEntity[entity.id] += Math.min(currErr, prevErr);
						if(this._errorPerEntity[entity.id] >= 1) {
							this._errorPerEntity[entity.id] = 0;
							//modify the client prediction so that either the CURRENT or the PAST client
							// state matches the current server state
							this._revisions.push({
								actions: [{
									type: 'set-entity-state',
									entityId: entity.id,
									entityState: entity.getState()
								}],
								frame: (currErr < prevErr ? clock.frame : clock.frame - delay)
							});
						}
					}
				}
				//the build-up of error deteriorates over time
				this._errorPerEntity[entity.id] *= 0.9;
			}
		}
	};
	SimulationSyncer.prototype.popRevisions = function() {
		var revisions = this._revisions;
		this._revisions = [];
		return revisions;
	};
	return SimulationSyncer;
});