define([
	'config',
	'shared/util/EventHelper'
], function(
	config,
	EventHelper
) {
	function TimeSyncer() {
		this.timeOffset = null;
		this.frameOffset = null;
		this._isRunning = false;
		this._serverTimeOffsetLowerBound = null;
		this._serverTimeOffsetUpperBound = null;
		this._serverFrameOffsetLowerBound = null;
		this._serverFrameOffsetUpperBound = null;
		this._pingsSinceLastChange = 0;
		this._isCalibrated = false;
		this._events = new EventHelper([ 'calibrated', 'offset-change' ]);
	}
	TimeSyncer.prototype.handlePing = function(timeSent, frameSent, serverTime, serverFrame, timeReceived, frameReceived) {
		var lowerBound = serverTime - timeReceived;
		var upperBound = serverTime - timeSent;
		if(this._serverTimeOffsetLowerBound === null || this._serverTimeOffsetLowerBound < lowerBound) {
			this._serverTimeOffsetLowerBound = lowerBound;
		}
		if(this._serverTimeOffsetUpperBound === null || this._serverFrameOffsetUpperBound > upperBound) {
			this._serverTimeOffsetUpperBound = upperBound;
		}
		lowerBound = serverFrame - frameReceived;
		upperBound = serverFrame - frameSent;
		if(this._serverFrameOffsetLowerBound === null || this._serverFrameOffsetLowerBound < lowerBound) {
			this._serverFrameOffsetLowerBound = lowerBound;
		}
		if(this._serverFrameOffsetUpperBound === null || this._serverFrameOffsetUpperBound > upperBound) {
			this._serverFrameOffsetUpperBound = upperBound;
		}

		//recalculate offsets
		var timeOffset = this._serverTimeOffsetLowerBound * config.TIME_SYNC_LOWER_BOUND_WEIGHT +
			this._serverTimeOffsetUpperBound * (1 - config.TIME_SYNC_LOWER_BOUND_WEIGHT);
		var frameOffset = Math.ceil(this._serverFrameOffsetLowerBound * config.TIME_SYNC_LOWER_BOUND_WEIGHT +
			this._serverFrameOffsetUpperBound * (1 - config.TIME_SYNC_LOWER_BOUND_WEIGHT));
		// console.log(timeSent, frameSent, serverTime, serverFrame, timeReceived, frameReceived);
		if(timeOffset !== this.timeOffset || frameOffset !== this.frameOffset) {
			this.timeOffset = timeOffset;
			this.frameOffset = frameOffset;
			this._pingsSinceLastChange = 0;
			this._events.trigger('offset-change', this.timeOffset, this.frameOffset);
		}
		else {
			this._pingsSinceLastChange++;
		}

		//check for calibrated
		if(!this._isCalibrated && this._pingsSinceLastChange >= config.PINGS_UNTIL_CLOCK_SYNCED) {
			this._isCalibrated = true;
			this._events.trigger('calibrated');
		}
	};
	TimeSyncer.prototype.start = function() {
		if(!this._isRunning) {
			this._isRunning = true;
			this._reset();
		}
	};
	TimeSyncer.prototype.stop = function() {
		if(this._isRunning) {
			this._isRunning = false;
			this._reset();
		}
	};
	TimeSyncer.prototype._reset = function() {
		this.timeOffset = null;
		this.frameOffset = null;
		this._serverTimeOffsetLowerBound = null;
		this._serverTimeOffsetUpperBound = null;
		this._serverFrameOffsetLowerBound = null;
		this._serverFrameOffsetUpperBound = null;
		this._pingsSinceLastChange = 0;
		this._isCalibrated = false;
	};
	TimeSyncer.prototype.isRunning = function() {
		return this._isRunning;
	};
	TimeSyncer.prototype.isCalibrated = function() {
		return this._isCalibrated;
	};
	TimeSyncer.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	return new TimeSyncer();
});