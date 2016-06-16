define([
	'config',
	'net/conn',
	'shared/util/EventHelper',
	'display/draw',
	'time/clock'
], function(
	config,
	conn,
	EventHelper,
	draw,
	clock
) {
	function Pinger() {
		this.timeLatency = null;
		this.frameLatency = null;
		this._timeOfPrevPing = null;
		this._timesPinged = 0;
		this._recentPings = [];
		this._isCalibrated = false;
		this._events = new EventHelper([ 'calibrated', 'latency-change' ]);
	}
	Pinger.prototype.handlePing = function(timeSent, frameSent, serverTime, serverFrame, timeReceived, frameReceived) {
		this._recentPings.push({
			timeLatency: timeReceived - timeSent,
			frameLatency: frameReceived - frameSent
		});
		if(this._recentPings.length > config.PINGS_TO_STORE) {
			this._recentPings.shift();
		}
		var sortedPings = this._recentPings.concat().sort(function(a, b) {
			return b.timeLatency - a.timeLatency;
		});
		var slowestAcceptablePing;
		if(sortedPings.length > config.PINGS_TO_IGNORE) {
			slowestAcceptablePing = sortedPings[config.PINGS_TO_IGNORE];
		}
		else {
			slowestAcceptablePing = sortedPings[sortedPings.length - 1];
		}
		var timeLatency = slowestAcceptablePing.timeLatency;
		var frameLatency = slowestAcceptablePing.frameLatency;
		if(this.timeLatency === null || this.timeLatency < timeLatency) {
			//raise the latency
			this.timeLatency = timeLatency;
			this.frameLatency = frameLatency;
			this._events.trigger('latency-change', this.timeLatency, this.frameLatency);
			//TODO more logic
		}
		else if(this.timeLatency > timeLatency) {
			//possibly lower the latency
			this.timeLatency = timeLatency;
			this.frameLatency = frameLatency;
			this._events.trigger('latency-change', this.timeLatency, this.frameLatency);
			//TODO more logic
		}
		if(!this._isCalibrated && this._timesPinged >= config.PINGS_TO_STORE) {
			this._isCalibrated = true;
			this._events.trigger('calibrated');
		}
	};
	Pinger.prototype.update = function(ms) {
		if(this._isRunning && conn.isConnected()) {
			var delay = (this._timesPinged < config.PINGS_TO_STORE ?
					config.MILLISECONDS_BETWEEN_PINGS_INITIALLY : config.MILLISECONDS_BETWEEN_PINGS);
			if(this._timeOfPrevPing === null || clock.serverTime >= this._timeOfPrevPing + delay) {
				this._timesPinged++;
				this._timeOfPrevPing = clock.serverTime;
				conn.ping();
			}
		}
	};
	Pinger.prototype.isCalibrated = function() {
		return this._isCalibrated;
	};
	Pinger.prototype.start = function() {
		if(!this._isRunning) {
			this._isRunning = true;
			this._reset();
		}
	};
	Pinger.prototype.stop = function() {
		if(this._isRunning) {
			this._isRunning = false;
			this._reset();
		}
	};
	Pinger.prototype.isRunning = function() {
		return this._isRunning;
	};
	Pinger.prototype._reset = function() {
		this.timeLatency = null;
		this._timeOfPrevPing = null;
		this._timesPinged = 0;
		this._recentPings = [];
		this._isCalibrated = false;
	};
	Pinger.prototype.render = function() {
		//calculate max latency
		var maxLatency = this.timeLatency;
		for(var i = 0; i < this._recentPings.length; i++) {
			maxLatency = Math.max(maxLatency, this._recentPings[i].timeLatency);
		}
		maxLatency = 100 * Math.ceil((maxLatency + 1) / 100);

		//drawing params
		var graphHeight = 50;
		var graphWidth = 150;
		var barMargin = 1;
		var barWidth = (150 / config.PINGS_TO_STORE) - barMargin;

		//draw the bars
		for(i = 0; i < this._recentPings.length; i++) {
			var x = barWidth * i + barMargin * (i + 1);
			var barHeight = graphHeight * this._recentPings[i].timeLatency / maxLatency;
			var y = config.CANVAS_HEIGHT - barHeight - barMargin;
			draw.rect(x, y, barWidth, barHeight, { fill: 'rgba(255, 255, 0, 0.5)', fixed: true });
		}

		//draw the chosen latency
		var lineHeight = graphHeight * this.timeLatency / maxLatency;
		var lineY = config.CANVAS_HEIGHT -lineHeight - barMargin;
		draw.line(barMargin, lineY, barMargin + graphWidth, lineY, { stroke: '#fff', thickness: 2 });

		//draw latency
		draw.text(this.timeLatency === null ? '' : Math.round(this.timeLatency) + 'ms',
			barMargin + graphWidth + 5, lineY + 5, { fill: '#fff', align: 'left' });
	};
	Pinger.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	return new Pinger();
});