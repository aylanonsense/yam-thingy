define([
	'shared/config',
	'time/now',
	'shared/util/EventHelper'
], function(
	sharedConfig,
	now,
	EventHelper
) {
	function StableFrameRateClock(params) {
		this.time = 0;
		this.frame = 0;
		this._isRunning = false;
		this._runStartTime = null;
		this._timer = null;
		this._events = new EventHelper([ 'tick' ]);
	}
	StableFrameRateClock.prototype.start = function() {
		if(!this._isRunning) {
			this._isRunning = true;
			this._runStartTime = now();
			this.time = 0;
			this.scheduleLoop();
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
	StableFrameRateClock.prototype.scheduleLoop = function() {
		var self = this;
		var minDelay = sharedConfig.FRAMES_PER_SECOND_MAX_SLOW_DOWN * 1000 / sharedConfig.FRAMES_PER_SECOND;
		var maxDelay = sharedConfig.FRAMES_PER_SECOND_MAX_SPEED_UP * 1000 / sharedConfig.FRAMES_PER_SECOND;
		var delay;
		if(this.time < 1000) {
			//to start, just use the frame rate
			delay = 1000 / sharedConfig.FRAMES_PER_SECOND;
		}
		else {
			//afterwards, we want a delay such that we get to the ideal frame rate
			delay = 1000 * (this.frame + 1) / sharedConfig.FRAMES_PER_SECOND - this.time;
		}
		delay = Math.max(minDelay, Math.min(delay, maxDelay));
		this._timer = setTimeout(function() { self._timer = null; self.loop(); }, delay);
	};
	StableFrameRateClock.prototype.loop = function() {
		if(this._isRunning) {
			var prevTime = this.time;
			this.time = now() - this._runStartTime;
			this.frame++;
			this.scheduleLoop();
			this._events.trigger('tick', this.time - prevTime);
		}
	};
	StableFrameRateClock.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	return new StableFrameRateClock();
});
