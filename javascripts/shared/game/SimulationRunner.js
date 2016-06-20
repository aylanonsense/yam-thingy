define(function() {
	function SimulationRunner(params) {
		this._framesOfHistory = params.framesOfHistory;
		this.simulation = params.simulation;
		this.frame = null;
		this._hasState = false;
		this._stateHistory = [];
		this._actionHistory = [];
	}
	SimulationRunner.prototype.reset = function(frame) {
		this.simulation.reset();
		this.frame = frame;
		this._hasState = false;
		this._stateHistory = [];
		this._actionHistory = [];
	};
	SimulationRunner.prototype.hasState = function() {
		return this._hasState;
	};
	SimulationRunner.prototype.getState = function() {
		return (this._hasState ? this.simulation.getState() : null);
	};
	SimulationRunner.prototype.setState = function(state, frame) {
		//get rid of future states, they will need to be regenerated
		this._removeStateHistoryAfter(frame);

		//record the state
		this._stateHistory.push({
			state: state,
			frame: frame,
			isGenerated: false
		});

		//if the frame is in the past, we need to rewind to handle it
		if(frame <= this.frame) {
			this._regenerateStateHistoryAfter(frame);
			this._hasState = true;
		}
	};
	SimulationRunner.prototype._removeStateHistoryAfter = function(frame) {
		//inclusive (history on the given frame will be removed as well)
		this._stateHistory = this._stateHistory.filter(function(record) {
			return record.frame < frame || (!record.isGenerated && record.frame > frame);
		});
	};
	SimulationRunner.prototype._regenerateStateHistoryAfter = function(frame) {
		var currentFrame = this.frame;

		//find the closest state before then
		var closestRecord = null;
		for(var i = 0; i < this._stateHistory.length; i++) {
			if(this._stateHistory[i].frame <= frame && (closestRecord === null ||
				this._stateHistory[i].frame > closestRecord.frame)) {
				closestRecord = this._stateHistory[i];
			}
		}
		if(!closestRecord) {
			throw new Error('Cannot regenerate state from frame ' + frame);
		}

		//rewind to that state
		this.frame = closestRecord.frame;
		this.simulation.setState(closestRecord.state);

		//now move forward until we make it back to the present
		while(this.frame < currentFrame) {
			this._nextFrame();
		}
	};
	SimulationRunner.prototype._nextFrame = function() {
		this.frame++;

		//see if there's an existing state for this frame
		var existingRecord = null;
		for(var i = 0; i < this._stateHistory.length; i++) {
			if(this._stateHistory[i].frame === this.frame) {
				existingRecord = this._stateHistory[i];
				break;
			}
		}

		//if there's an existing state, our job is easy
		if(existingRecord) {
			this.simulation.setState(existingRecord.state);
			this._hasState = true;
		}

		//otherwise we have to generate it
		else if(this._hasState) {
			//collect the actions that are applicable for this frame
			var actions = [];
			for(i = 0; i < this._actionHistory.length; i++) {
				if(this._actionHistory[i].frame === this.frame) {
					actions.push(this._actionHistory[i].action);
				}
			}

			//update the simulation
			this.simulation.update(actions);

			//add the state of the simulation to the history
			this._stateHistory.push({
				state: this.simulation.getState(),
				frame: this.frame,
				isGenerated: true
			});
		}
	};
	SimulationRunner.prototype.update = function() {
		this._nextFrame();
		this._removeOldHistory();
	};
	SimulationRunner.prototype._removeOldHistory = function() {
		var self = this;
		this._actionHistory = this._actionHistory.filter(function(record) {
			return record.frame >= self.frame - self._framesOfHistory;
		});
		this._stateHistory = this._stateHistory.filter(function(record) {
			return record.frame >= self.frame - self._framesOfHistory;
		});
	};
	SimulationRunner.prototype.handleAction = function(action, frame) {
		var self = this;

		//we can't do anything with actions that are very old (or too far in the future)
		if(frame < this.frame - this._framesOfHistory || frame > this.frame + 100) {
			return false;
		}

		//record the action
		this._actionHistory.push({
			action: action,
			frame: frame
		});

		//if the frame is in the past, we need to rewind to handle it
		if(frame <= this.frame) {
			this._removeStateHistoryAfter(frame);
			this._regenerateStateHistoryAfter(frame);
		}
		return true;
	};
	return SimulationRunner;
});