define([
	'config',
	'display/draw',
	'display/canvas',
	'shared/time/clock',
	'net/conn',
	'display/consoleUI',
	'net/LatencySyncer',
	'shared/game/Simulation',
	'shared/game/SimulationRunner',
	'display/SimulationRenderer',
	'shared/input/InputStream',
	'input/keyboard',
	'shared/game/player/Player'
], function(
	config,
	draw,
	canvas,
	clock,
	conn,
	consoleUI,
	LatencySyncer,
	Simulation,
	SimulationRunner,
	SimulationRenderer,
	InputStream,
	keyboard,
	Player
) {
	return function main() {
		//create all the network stuff
		var initialStateFrame = null;
		var receivedMessages = [];
		var syncer = new LatencySyncer();

		//create the simulations (one will be a prediction of the state based on user input)
		var simulation = new Simulation();
		var simulationRunner = new SimulationRunner({
			simulation: simulation,
			framesOfHistory: 12
		});
		var predictionSimulation = new Simulation();
		var predictionSimulationRunner = new SimulationRunner({
			simulation: predictionSimulation,
			framesOfHistory: 12
		});

		//create the player that will affect the prediction simulation
		var inputStream = new InputStream();
		var player = new Player({
			simulation: predictionSimulation
		});

		//create the renderer that will render the two simulations
		var simulationRenderer = new SimulationRenderer({
			primarySimulation: predictionSimulation,
			secondarySimulation: simulation
		});

		//resize the canvas
		canvas.setAttribute('width', config.CANVAS_WIDTH);
		canvas.setAttribute('height', config.CANVAS_HEIGHT);

		//the update loop
		clock.on('tick', function() {
			var i;

			//keep the network synced
			var networkInitialized = syncer.calibrateNetwork();
			if(networkInitialized) { //careful--clock.frame may have changed
				simulationRunner.reset(clock.frame - 1);
				predictionSimulationRunner.reset(clock.frame - 1);
				player.reset();
				initialStateFrame = null;
				conn.buffer({ type: 'join-game' });
				consoleUI.write('Initialized with ' +
					syncer.inputLatency + ' frames of input latency and ' +
					syncer.latency + ' frames of network latency');
			}

			//respond to server messages
			for(i = 0; i < receivedMessages.length; i++) {
				var msg = receivedMessages[i];
				//the client has joined frealzies
				if(msg.type === 'join-accept') {
					simulationRunner.scheduleState(msg.simulationState, msg.frame);
					player.setState(msg.playerState);
					player.join();
					inputStream.reset();
					if(initialStateFrame === null) {
						initialStateFrame = msg.frame;
						predictionSimulationRunner.scheduleState(msg.simulationState, msg.frame);
					}
				}
				//apply an action from the server
				else if(msg.type === 'actions') {
					simulationRunner.scheduleActions(msg.actions, msg.frame);
					if(!msg.causedByClientInput) {
						predictionSimulationRunner.scheduleActions(msg.actions, msg.frame);
					}
				}
				//refresh the state
				else if(msg.type === 'current-state' && initialStateFrame !== null) {
					simulationRunner.scheduleState(msg.simulationState, msg.frame);
					player.setState(msg.playerState);
				}
			}
			receivedMessages = [];

			//apply player actions to the prediction
			var inputs = inputStream.popInputs();
			player.update(inputs);
			var actions = player.popActions();
			if(actions.length > 0) {
				predictionSimulationRunner.scheduleActions(actions, clock.frame);
			}

			//update the simulations
			simulationRunner.update();
			predictionSimulationRunner.update();
			if(simulationRunner.frame !== clock.frame || predictionSimulationRunner.frame !== clock.frame) {
				throw new Error('Simulation runner(s) not in sync with the clock!');
			}

			//clear canvas
			draw.rect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT, { fill: '#000', fixed: true });

			//render the simulation (or the console if we're not there yet)
			if(initialStateFrame !== null && clock.frame >= initialStateFrame) {
				simulationRenderer.render();
			}
			else {
				consoleUI.render();
			}

			//flush network traffic
			conn.flush();
		});

		//handle network events
		conn.on('connect', function() {
			consoleUI.write('Connected to server');
			syncer.start();
		});
		conn.on('receive', function(msg) {
			if(msg.type === 'ping') {
				syncer.handlePing(msg);
			}
			else {
				receivedMessages.push(msg);
			}
		});
		conn.on('disconnect', function() {
			consoleUI.write('Disconnected from server...');
			syncer.stop();
			player.reset();
			receivedMessages = [];
			initialStateFrame = null;
		});

		//handle input events
		keyboard.on('key-event', function(key, isDown) {
			if(player.hasJoined()) {
				var input = {
					type: 'keyboard',
					key: key,
					isDown: isDown,
					state: keyboard.getState()
				};
				inputStream.scheduleInput(input, clock.frame + 1 + syncer.inputLatency, 0);
				conn.buffer({
					type: 'input',
					input: input,
					frame: clock.frame + 1 + syncer.latency,
					maxFramesLate: 6
				});
			}
		});

		//kick it all off!
		clock.start();
		conn.connect();
	};
});