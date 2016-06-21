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
	'display/SimulationRenderer',
	'shared/input/InputStream',
	'input/keyboard',
	'shared/game/Player'
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
	SimulationRenderer,
	InputStream,
	keyboard,
	Player
) {
	return function main() {
		var latency = null;
		var inputLatency = null;
		var networkTraffic = [];

		//create the simulation
		var simulation = new Simulation();
		var simulationRunner = new SimulationRunner({
			simulation: simulation,
			framesOfHistory: 12
		});

		//create the predicted simulation -- the one that'll use the user's input directly
		var predictionSimulation = new Simulation();
		var predictionSimulationRunner = new SimulationRunner({
			simulation: predictionSimulation,
			framesOfHistory: 12
		});
		var inputStream = new InputStream();
		var player = new Player({
			simulation: predictionSimulation,
			inputStream: inputStream
		});
		var simulationRenderer = new SimulationRenderer({
			simulation: simulation,
			prediction: predictionSimulation
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

		//handle input events
		keyboard.on('key-event', function(key, isDown) {
			var state = keyboard.getState();
			inputStream.addInput({
				key: key,
				isDown: isDown,
				state: state
			}, clock.frame + 1 + (inputLatency || 0), 0);
			conn.buffer({
				type: 'input',
				key: key,
				isDown: isDown,
				state: state,
				frame: clock.frame + 1 + latency,
				maxFramesLate: 6
			});
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
					simulationRunner.setState(networkTraffic[i].state, networkTraffic[i].frame);
					if(!predictionSimulationRunner.hasState()) {
						predictionSimulationRunner.setState(networkTraffic[i].state, networkTraffic[i].frame);
					}
				}
				else if(networkTraffic[i].type === 'action') {
					simulationRunner.handleAction(networkTraffic[i].action, networkTraffic[i].frame);
					if(!networkTraffic[i].causedByClientInput) {
						predictionSimulationRunner.handleAction(networkTraffic[i].action, networkTraffic[i].frame);
					}
				}
			}
			networkTraffic = [];

			//keep the client in sync with the server
			if(pinger.hasConfidentResults()) {
				var recalibratedNetwork = false;
				var messedWithClock = false;

				//initialize the network
				if(latency === null || pinger.offset - config.CLOCK_OFFSET > 10 || pinger.offset - config.CLOCK_OFFSET < -10) {
					latency = pinger.latency + config.LATENCY_BUFFER;
					inputLatency = Math.min(latency, config.MAX_INPUT_LATENCY);
					clock.frame += pinger.offset - config.CLOCK_OFFSET;
					recalibratedNetwork = true;
					simulationRunner.reset(clock.frame);
					predictionSimulationRunner.reset(clock.frame);
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
					if(pinger.offset - config.CLOCK_OFFSET < 0) {
						clock.slowDown(1);
						recalibratedNetwork = true;
						messedWithClock = true;
					}
					//if messages are arriving early to the client, speed up the game
					else if(pinger.offset - config.CLOCK_OFFSET > 1) {
						clock.speedUp(1);
						recalibratedNetwork = true;
						messedWithClock = true;
					}

					//if network latency got worse, take that into account
					if(pinger.latency + config.LATENCY_BUFFER > latency) {
						latency = pinger.latency + config.LATENCY_BUFFER;
						recalibratedNetwork = true;
					}
					//if network latency got better, adopt that slowly
					else if(pinger.latency + config.LATENCY_BUFFER < latency - 1) {
						latency -= Math.floor((latency - (pinger.latency + config.LATENCY_BUFFER)) / 2);
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
			var actions = player.popActions(clock.frame);
			for(i = 0; i < actions.length; i++) {
				//the actions based on local input are only applied to the prediction
				predictionSimulationRunner.handleAction(actions[i], clock.frame);
			}
			while(simulationRunner.frame < clock.frame) {
				simulationRunner.update();
			}
			while(predictionSimulationRunner.frame < clock.frame) {
				predictionSimulationRunner.update();
			}

			//render the simulation (or the console if we're not there yet)
			if(predictionSimulationRunner.hasState()) {
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