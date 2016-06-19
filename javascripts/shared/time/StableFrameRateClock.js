define([
	'shared/config',
	'time/now',
	'shared/util/EventHelper'
], function(
	sharedConfig,
	now,
	EventHelper
) {
	var MIN_DELAY = 1000 / (sharedConfig.FRAMES_PER_SECOND * sharedConfig.FRAMES_PER_SECOND_MAX_SPEED_UP);
	var MAX_DELAY = 1000 / (sharedConfig.FRAMES_PER_SECOND * sharedConfig.FRAMES_PER_SECOND_MAX_SLOW_DOWN);

	function StableFrameRateClock(params) {
		this._rawTime = 0;
		this._timeOffset = 0;
		this._rawFrame = 0;
		this._frameOffset = 0;
		this._frameDebt = 0;
		this._isRunning = false;
		this._runStartTime = null;
		this._timer = null;
		this._events = new EventHelper([ 'tick' ]);
	}
	StableFrameRateClock.prototype.speedUp = function(frames) {
		this._frameDebt -= frames;
	};
	StableFrameRateClock.prototype.slowDown = function(frames) {
		this._frameDebt += frames;
	};
	StableFrameRateClock.prototype.start = function() {
		if(!this._isRunning) {
			this._isRunning = true;
			this._runStartTime = now();
			this._rawTime = 0;
			this._scheduleTick();
		}
	};
	StableFrameRateClock.prototype.stop = function() {
		if(this._isRunning) {
			this._isRunning = false;
			if(this._timer) {
				clearTimeout(this._timer);
				this._timer = null;
			}
		}
	};
	StableFrameRateClock.prototype.restart = function() {
		this.stop();
		this.start();
	};
	StableFrameRateClock.prototype.isRunning = function() {
		return this._isRunning;
	};
	StableFrameRateClock.prototype._scheduleTick = function() {
		var self = this;
		delay = 1000 * (this._rawFrame + this._frameDebt + 1) / sharedConfig.FRAMES_PER_SECOND - this._rawTime;
		delay = Math.max(MIN_DELAY, Math.min(delay, MAX_DELAY));
		this._timer = setTimeout(function() { self._timer = null; self._tick(); }, delay);
	};
	StableFrameRateClock.prototype._tick = function() {
		if(this._isRunning) {
			var prevTime = this._rawTime;
			this._rawTime = now() - this._runStartTime;
			this._rawFrame++;
			this._scheduleTick();
			this._events.trigger('tick', this._rawTime - prevTime);
		}
	};
	StableFrameRateClock.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	Object.defineProperties(StableFrameRateClock.prototype, {
		time: {
			get: function() {
				return this._rawTime + this._timeOffset;
			},
			set: function(time) {
				this._timeOffset = time - this._rawTime;
			}
		},
		frame: {
			get: function() {
				return this._rawFrame + this._frameOffset;
			},
			set: function(frame) {
				this._frameOffset = frame - this._rawFrame;
			}
		}
	});
	return StableFrameRateClock;
});
