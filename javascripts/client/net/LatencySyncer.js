define([
	'config',
	'shared/time/clock',
	'net/Pinger'
], function(
	config,
	clock,
	Pinger
) {
	function LatencySyncer() {
		this.latency = null;
		this.inputLatency = null;
		this._pinger = new Pinger();
		this._pings = [];
	}
	LatencySyncer.prototype.isSynced = function() {
		return this.latency !== null;
	};
	LatencySyncer.prototype.start = function() {
		this.latency = null;
		this.inputLatency = null;
		this._pings = [];
		this._pinger.start(config.MILLISECONDS_BETWEEN_PINGS_INITIALLY, 0);
	};
	LatencySyncer.prototype.stop = function() {
		this.latency = null;
		this.inputLatency = null;
		this._pings = [];
		this._pinger.stop();
	};
	LatencySyncer.prototype.handlePing = function(ping) {
		this._pings.push(ping);
	};
	LatencySyncer.prototype.calibrateNetwork = function(pings) {
		//handle all the pings that were buffered until the next frame
		for(var i = 0; i < this._pings.length; i++) {
			this._pinger.handlePing(this._pings[i]);
		}
		this._pings = [];

		//ping the server periodically
		this._pinger.update();

		//keep the client in sync with the server
		if(this._pinger.hasConfidentResults()) {
			//initialize the network
			if(this.latency === null || this._pinger.offset - config.CLOCK_OFFSET > 10 || this._pinger.offset - config.CLOCK_OFFSET < -10) {
				this.latency = this._pinger.latency + config.LATENCY_BUFFER;
				this.inputLatency = Math.min(this.latency, config.MAX_INPUT_LATENCY);
				clock.frame += this._pinger.offset - config.CLOCK_OFFSET;
				this._pinger.restart(config.MILLISECONDS_BETWEEN_PINGS, 0);
				return true; //network was initialized
			}
			//otherwise we may need to occasionally recalibrate the network
			else {
				var recalibratedNetwork = false;
				var messedWithClock = false;

				//if messages are arriving late to the client, slow down the game to compensate
				if(this._pinger.offset - config.CLOCK_OFFSET < 0) {
					clock.slowDown(1);
					recalibratedNetwork = true;
					messedWithClock = true;
				}
				//if messages are arriving early to the client, speed up the game
				else if(this._pinger.offset - config.CLOCK_OFFSET > 1) {
					clock.speedUp(1);
					recalibratedNetwork = true;
					messedWithClock = true;
				}

				//if network latency got worse, take that into account
				if(this._pinger.latency + config.LATENCY_BUFFER > this.latency) {
					this.latency = this._pinger.latency + config.LATENCY_BUFFER;
					recalibratedNetwork = true;
				}
				//if network latency got better, adopt that slowly
				else if(this._pinger.latency + config.LATENCY_BUFFER < this.latency - 1) {
					this.latency -= Math.floor((this.latency - (this._pinger.latency + config.LATENCY_BUFFER)) / 2);
					if(this.inputLatency > this.latency) {
						this.inputLatency = this.latency;
					}
					recalibratedNetwork = true;
				}

				if(recalibratedNetwork) {
					this._pinger.restart(config.MILLISECONDS_BETWEEN_PINGS, messedWithClock ? 500 : 0);
				}
			}

		}
		return false;
	};
	return LatencySyncer;
});