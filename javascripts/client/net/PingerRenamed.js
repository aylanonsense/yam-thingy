define([
	'config',
	'net/conn',
	'shared/time/clock'
], function(
	config,
	conn,
	clock
) {
	function Pinger() {
		this.latency = null;
		this.offset = null;
		this._timeOfNextPing = null;
		this._millisecondsBetweenPings = null;
		this._pingVersion = 0;
		this._recentPings = [];
	}
	Pinger.prototype.hasConfidentResults = function() {
		return this._recentPings.length >= config.PINGS_TO_STORE;
	};
	Pinger.prototype.handlePing = function(ping) {
		if(ping.version === this._pingVersion) {
			var clientSendFrame = ping.clientFrame;
			var serverReceiveFrame = ping.serverFrame;
			var clientReceiveFrame = clock.frame;
			this._recentPings.push({
				latency: clientReceiveFrame - clientSendFrame,
				offset: serverReceiveFrame - clientReceiveFrame //ideally 0 or slightly positive
			});
			if(this._recentPings.length > config.PINGS_TO_STORE) {
				this._recentPings.shift();
			}

			//recalculate latency and clock offset
			var maxLatency = this._recentPings[0].latency;
			var minOffset = this._recentPings[0].offset;
			for(var i = 1; i < this._recentPings.length; i++) {
				maxLatency = Math.max(maxLatency, this._recentPings[i].latency);
				minOffset = Math.min(minOffset, this._recentPings[i].offset);
			}
			this.latency = maxLatency;
			this.offset = minOffset;
		}
	};
	Pinger.prototype.update = function() {
		if(this._timeOfNextPing !== null && clock.time >= this._timeOfNextPing && conn.isConnected()) {
			conn.buffer({
				type: 'ping',
				version: this._pingVersion,
				clientFrame: clock.frame
			});
			this._timeOfNextPing = clock.time + this._millisecondsBetweenPings;
		}
	};
	Pinger.prototype.start = function(msBetween, initialDelay) {
		if(this._timeOfNextPing === null) {
			this.latency = null;
			this._millisecondsBetweenPings = msBetween;
			this.offset = null;
			this._timeOfNextPing = clock.time + initialDelay;
			this._recentPings = [];
		}
	};
	Pinger.prototype.stop = function() {
		if(this._timeOfNextPing !== null) {
			this._timeOfNextPing = null;
			this._millisecondsBetweenPings = null;
			this._pingVersion++;
		}
	};
	Pinger.prototype.restart = function(msBetween, initialDelay) {
		this.stop();
		this.start(msBetween, initialDelay);
	};
	Pinger.prototype.isPinging = function() {
		return this._timeOfNextPing !== null;
	};
	return Pinger;
});