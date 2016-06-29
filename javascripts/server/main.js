define([
	'config',
	'net/startWebServer',
	'net/startSocketServer',
	'net/ClientServer',
	'shared/time/clock',
	'shared/game/Simulation',
	'shared/game/SimulationRunner',
	'shared/input/InputStream',
	'shared/game/player/Player',
	'shared/game/player/GameMaster'
], function(
	config,
	startWebServer,
	startSocketServer,
	ClientServer,
	clock,
	Simulation,
	SimulationRunner,
	InputStream,
	Player,
	GameMaster
) {
	return function main() {
		var nextActionId = 0;
		function addIdsToActions(actions) {
			for(var i = 0; i < actions.length; i++) {
				actions[i].id = 'server_' + (nextActionId++);
			}
			return actions;
		}

		//start server
		var webServer = startWebServer();
		var socketServer = startSocketServer(webServer);

		//create the simulation
		var simulation = new Simulation();
		var simulationRunner = new SimulationRunner({
			simulation: simulation,
			framesOfHistory: 5
		});

		//create the game master that will do a lot of the CPU decision-making
		var gameMaster = new GameMaster({
			simulation: simulation
		});

		//create all the network stuff
		var timeOfLastStateSend = null;
		var clientServer = new ClientServer({
			simulation: simulation,
			socketServer: socketServer
		});

		//handle network events
		var receivedMessages = [];
		clientServer.on('connect', function(client) {
			client.on('receive', function(msg) {
				if(msg.type === 'input') {
					if(msg.frame < clock.frame + 1) {
						console.log('Input arrived ' + (clock.frame + 1 - msg.frame) + ' frames late', msg);
					}
					client.inputStream.scheduleInput(msg.input, msg.frame, msg.maxFramesLate);
				}
				else {
					receivedMessages.push({ client: client, message: msg });
				}
			});
			client.on('disconnect', function() {
				gameMaster.removePlayer(client.player);
			});
		});

		//the update loop
		clock.on('tick', function() {
			var i, msg, client, actions;

			//respond to client messages
			var stateRequests = [];
			for(i = 0; i < receivedMessages.length; i++) {
				client = receivedMessages[i].client;
				msg = receivedMessages[i].message;
				if(msg.type === 'ping') {
					client.buffer({
						type: 'ping',
						version: msg.version,
						clientFrame: msg.clientFrame,
						serverFrame: clock.frame
					});
				}
				else if(msg.type === 'join-game') {
					if(!client.player.hasJoined()) {
						gameMaster.addPlayer(client.player);
					}
					stateRequests.push(receivedMessages[i]);
				}
			}
			receivedMessages = [];

			//generate actions from user input
			for(i = 0; i < clientServer.clients.length; i++) {
				client = clientServer.clients[i];
				var inputs = client.inputStream.popInputs();
				client.player.update(inputs);
				actions = client.player.popActions();
				if(actions.length > 0) {
					addIdsToActions(actions);
					simulationRunner.scheduleActions(actions, clock.frame);
					clientServer.bufferToAllExcept({
						type: 'actions',
						actions: actions.map(function(action) {
							var actionCopy = {};
							for(var key in action) {
								if(key !== 'inputId') {
									actionCopy[key] = action[key];
								}
							}
							return actionCopy;
						}),
						frame: clock.frame,
						causedByClientInput: false
					}, client);
					client.buffer({
						type: 'actions',
						actions: actions,
						frame: clock.frame,
						causedByClientInput: true
					});
				}
			}

			//generate actions from the game master
			gameMaster.update();
			actions = gameMaster.popActions();
			if(actions.length > 0) {
				addIdsToActions(actions);
				simulationRunner.scheduleActions(actions, clock.frame);
				clientServer.bufferToAll({
					type: 'actions',
					actions: actions,
					frame: clock.frame,
					causedByClientInput: false
				});
			}

			//update the simulation
			simulationRunner.update();

			//now that the simulation is updated, we can send the state to clients that want it
			if(timeOfLastStateSend === null || timeOfLastStateSend < clock.time - config.MILLISECONDS_BETWEEN_SENDING_STATE) {
				timeOfLastStateSend = clock.time;
				for(i = 0; i < clientServer.clients.length; i++) {
					client.buffer({
						type: 'current-state',
						simulationState: simulation.getState(),
						playerState: client.player.getState(),
						frame: clock.frame
					});
				}
			}
			for(i = 0; i < stateRequests.length; i++) {
				client = stateRequests[i].client;
				msg = stateRequests[i].message;
				if(msg.type === 'join-game') {
					client.buffer({
						type: 'join-accept',
						simulationState: simulation.getState(),
						playerState: client.player.getState(),
						frame: clock.frame
					});
				}
			}
			stateRequests = [];

			//flush network traffic
			clientServer.flushAll();
		});

		//kick it all off!
		clock.start();
		simulationRunner.reset(clock.frame);
		gameMaster.reset();
		var initialActions = gameMaster.popActions();
		if(initialActions.length > 0) {
			addIdsToActions(initialActions);
			simulationRunner.scheduleActions(initialActions, clock.frame);
		}
		clientServer.startListening();
	};
}); 