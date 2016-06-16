define([
	'shared/config',
	'time/now',
	'shared/util/EventHelper'
], function(
	sharedConfig,
	now,
	EventHelper
) {
	var MIN_DELAY = (1000 / sharedConfig.FRAMES_PER_SECOND) / sharedConfig.FRAMES_PER_SECOND_MAX_SPEED_UP;
	var MAX_DELAY = (1000 / sharedConfig.FRAMES_PER_SECOND) / sharedConfig.FRAMES_PER_SECOND_MAX_SLOW_DOWN;

	function ClientServerClock() {
		this._isRunning = false;
		this._isSynced = true;
		this._timer = null;
		this._startTime = now();
		this._serverTimer = null;
		this.serverTime = 0;
		this.serverFrame = 0;
		this._clientTimer = null;
		this.clientTime = 0;
		this.clientFrame = 0;
		this._clientFrameDebt = 0;
		this._events = new EventHelper([ 'server-tick', 'client-tick', 'desynced', 'synced' ]);
	}
	ClientServerClock.prototype.speedUp = function(numFrames) {
		this._clientFrameDebt -= numFrames;
	};
	ClientServerClock.prototype.slowDown = function(numFrames) {
		this._clientFrameDebt += numFrames;
	};
	ClientServerClock.prototype._scheduleSyncedTick = function() {
		var self = this;
		var delay = Math.max(MIN_DELAY, Math.min(MAX_DELAY,
			1000 * (this.serverFrame + 1) / sharedConfig.FRAMES_PER_SECOND - this.serverTime));
		this._timer = setTimeout(function() {
			self._timer = null;
			if(self.isRunning) {
				var time = now() - self._startTime;
				var prevServerTime = self.serverTime;
				self.serverTime = time;
				self.serverFrame++;
				var prevClientTime = self.clientTime;
				self.clientTime = time;
				self.clientFrame++;
				if(self.serverFrame === self.clientFrame + self._clientFrameDebt) {
					self._scheduleSyncedTick();
					self._events.trigger('server-tick', self.serverTime - prevServerTime);
					self._events.trigger('client-tick', self.clientTime - prevClientTime);
				}
				else {
					self._isSynced = false;
					self._scheduleServerTick();
					self._scheduleClientTick();
					self._events.trigger('server-tick', self.serverTime - prevServerTime);
					self._events.trigger('client-tick', self.clientTime - prevClientTime);
					self._events.trigger('desynced');
				}
			}
		}, delay);
	};
	ClientServerClock.prototype._scheduleServerTick = function() {
		var self = this;
		var delay = Math.max(MIN_DELAY, Math.min(MAX_DELAY,
			1000 * (this.serverFrame + 1) / sharedConfig.FRAMES_PER_SECOND - this.serverTime));
		this._serverTimer = setTimeout(function() {
			self._serverTimer = null;
			if(self.isRunning) {
				var time = now() - self._startTime;
				var prevTime = self.serverTime;
				self.serverTime = time;
				self.serverFrame++;
				if(self.serverFrame === self.clientFrame + self._clientFrameDebt &&
					self.serverTime - 2 < self.clientTime && self.serverTime + 2 > self.clientTime) {
					if(self._clientTimer) {
						clearTimeout(self._clientTimer);
						self._clientTimer = null;
					}
					self._isSynced = true;
					self._scheduleSyncedTick();
					self._events.trigger('server-tick', self.serverTime - prevTime);
					self._events.trigger('synced');
				}
				else {
					self._scheduleServerTick();
					self._events.trigger('server-tick', self.serverTime - prevTime);
				}
			}
		}, delay);
	};
	ClientServerClock.prototype._scheduleClientTick = function() {
		var self = this;
		var delay = Math.max(MIN_DELAY, Math.min(MAX_DELAY,
			1000 * (this.clientFrame + this._clientFrameDebt + 1) / sharedConfig.FRAMES_PER_SECOND - this.clientTime));
		this._clientTimer = setTimeout(function() {
			self._clientTimer = null;
			if(self.isRunning) {
				var time = now() - self._startTime;
				var prevTime = self.clientTime;
				self.clientTime = time;
				self.clientFrame++;
				if(self.serverFrame === self.clientFrame + self._clientFrameDebt &&
					self.serverTime - 2 < self.clientTime && self.serverTime + 2 > self.clientTime) {
					if(self._serverTimer) {
						clearTimeout(self._serverTimer);
						self._serverTimer = null;
					}
					self._isSynced = true;
					self._scheduleSyncedTick();
					self._events.trigger('client-tick', self.clientTime - prevTime);
					self._events.trigger('synced');
				}
				else {
					self._scheduleClientTick();
					self._events.trigger('client-tick', self.clientTime - prevTime);
				}
			}
		}, delay);
	};
	ClientServerClock.prototype.start = function() {
		if(!this._isRunning) {
			this._isRunning = true;
			this._isSynced = true;
			this._startTime = now();
			this.serverTime = 0;
			this.serverFrame = 0;
			this.clientTime = 0;
			this.clientFrame = 0;
			this._clientFrameDebt = 0;
			this._scheduleSyncedTick();
		}
	};
	ClientServerClock.prototype.stop = function() {
		if(this._isRunning) {
			this._isRunning = false;
			if(this._timer) {
				clearTimeout(this._timer);
				this._timer = null;
			}
			if(this._serverTimer) {
				clearTimeout(this._serverTimer);
				this._serverTimer = null;
			}
			if(this._clientTimer) {
				clearTimeout(this._clientTimer);
				this._clientTimer = null;
			}
		}
	};
	ClientServerClock.prototype.restart = function() {
		this.stop();
		this.start();
	};
	ClientServerClock.prototype.isRunning = function() {
		return this._isRunning;
	};
	ClientServerClock.prototype.isSynced = function() {
		return this._isSynced;
	};
	ClientServerClock.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	return new ClientServerClock();
});