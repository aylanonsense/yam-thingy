define([
	'config',
	'display/draw',
	'display/canvas',
	'shared/time/clock',
	'net/conn',
	'display/consoleUI',
	'net/pinger',
	'shared/game/Simulation',
	'shared/game/SimulationRunner',
	'display/SimulationRenderer'
], function(
	config,
	draw,
	canvas,
	clock,
	conn,
	consoleUI,
	pinger,
	Simulation,
	SimulationRunner,
	SimulationRenderer
) {
	return function main() {
		var latency = null;
		var inputLatency = 4;
		var networkTraffic = [];

		//create the simulation
		var simulation = new Simulation();
		var simulationRunner = new SimulationRunner({
			simulation: simulation,
			framesOfHistory: 12
		});
		var simulationRenderer = new SimulationRenderer({
			simulation: simulation
		});

		//resize the canvas
		canvas.setAttribute('width', config.CANVAS_WIDTH);
		canvas.setAttribute('height', config.CANVAS_HEIGHT);

		//handle network events
		conn.on('connect', function(isReconnect) {
			consoleUI.write(isReconnect ? 'Reconnected to server' : 'Connected to server');
			pinger.start(config.MILLISECONDS_BETWEEN_PINGS_INITIALLY, 0);
		});
		conn.on('disconnect', function(isPermanent) {
			consoleUI.write('Disconnected ' + (isPermanent ? 'permanently ' : '') + 'from server...');
			latency = null;
			networkTraffic = [];
			pinger.stop();
		});
		conn.on('receive', function(msg) {
			networkTraffic.push(msg);
		});

		//handle the update loop
		clock.on('tick', function() {
			//ping the server periodically
			pinger.update();

			//respond to network traffic
			for(var i = 0; i < networkTraffic.length; i++) {
				if(networkTraffic[i].type === 'ping') {
					pinger.handlePing(networkTraffic[i]);
				}
				else if(networkTraffic[i].type === 'simulation-state') {
					consoleUI.write('Received simulation state');
					simulationRunner.setState(networkTraffic[i].state, networkTraffic[i].frame);
				}
				else if(networkTraffic[i].type === 'action') {
					simulationRunner.handleAction(networkTraffic[i].action, networkTraffic[i].frame);
				}
			}
			networkTraffic = [];

			//keep the client in sync with the server
			if(pinger.hasConfidentResults()) {
				var recalibratedNetwork = false;
				var messedWithClock = false;

				//initialize the network
				if(latency === null || pinger.offset > 10 || pinger.offset < -10) {
					latency = pinger.latency;
					clock.frame += pinger.offset;
					recalibratedNetwork = true;
					simulationRunner.reset(clock.frame);
					conn.buffer({
						type: 'request-simulation-state'
					});
					consoleUI.write('Calibrated with ' +
						inputLatency + ' frames of input latency and ' +
						latency + ' frames of network latency');
				}
				//otherwise we may need to occasionally recalibrate the network
				else {
					//if messages are arriving late to the client, slow down the game to compensate
					if(pinger.offset < 0) {
						clock.slowDown(1);
						recalibratedNetwork = true;
						messedWithClock = true;
					}
					//if messages are arriving early to the client, speed up the game
					else if(pinger.offset > 1) {
						clock.speedUp(1);
						recalibratedNetwork = true;
						messedWithClock = true;
					}

					//if network latency got worse, take that into account
					if(pinger.latency > latency) {
						latency = pinger.latency;
						recalibratedNetwork = true;
					}
					//if network latency got better, adopt that slowly
					else if(pinger.latency < latency - 1) {
						latency -= Math.floor((latency - pinger.latency) / 2);
						recalibratedNetwork = true;
					}
				}

				if(recalibratedNetwork) {
					pinger.restart(config.MILLISECONDS_BETWEEN_PINGS, messedWithClock ? 500 : 0);
				}
			}

			//clear canvas
			draw.rect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT, { fill: '#000', fixed: true });

			//update the simulation
			while(simulationRunner.frame < clock.frame) {
				simulationRunner.update();
			}

			//render the simulation (or the console if we're not there yet)
			if(simulationRunner.hasState()) {
				simulationRenderer.render();
			}
			else {
				consoleUI.render();
			}

			//flush network traffic
			conn.flush();
		});

		//kick it all off!
		clock.start();
		conn.connect();
	};
});