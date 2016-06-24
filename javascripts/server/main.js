define([
	'net/startWebServer',
	'net/startSocketServer',
	'net/server',
	'shared/time/clock',
	'shared/game/Simulation',
	'shared/game/SimulationRunner',
	'shared/input/InputStream',
	'shared/game/Player',
	'shared/game/GameMaster'
], function(
	startWebServer,
	startSocketServer,
	connServer,
	clock,
	Simulation,
	SimulationRunner,
	InputStream,
	Player,
	GameMaster
) {
	return function main() {
		//create the simulation
		var simulation = new Simulation();
		var simulationRunner = new SimulationRunner({
			simulation: simulation,
			framesOfHistory: 5
		});
		var gameMaster = new GameMaster({
			simulation: simulation
		});

		//start server
		var webServer = startWebServer();
		var socketServer = startSocketServer(webServer);

		//handle network events
		var nextClientId = 0;
		var clients = [];
		var networkTraffic = [];
		connServer.on('connect', function(conn) {
			var clientId = nextClientId++;
			var inputStream = new InputStream();
			var player = new Player({
				simulation: simulation,
				inputStream: inputStream
			});
			var client = {
				id: clientId,
				player: player,
				conn: conn
			};
			clients.push(client);
			conn.on('receive', function(msg) {
				if(msg.type === 'input') {
					if(msg.frame < clock.frame + 1) {
						console.log('Input arrived ' + (clock.frame + 1 - msg.frame) + ' frames late', msg);
					}
					inputStream.addInput({
						key: msg.key,
						isDown: msg.isDown,
						state: msg.state
					}, msg.frame, msg.maxFramesLate);
				}
				else {
					networkTraffic.push({
						client: client,
						message: msg
					});
				}
			});
			conn.on('disconnect', function() {
				clients = clients.filter(function(client) {
					return client.id !== clientId;
				});
				gameMaster.removePlayer(player);
			});
			gameMaster.addPlayer(player);
		});

		//handle the update loop
		clock.on('tick', function() {
			var i, j, k;

			//respond to network traffic
			for(i = 0; i < networkTraffic.length; i++) {
				if(networkTraffic[i].message.type === 'ping') {
					// console.log('ping sent at time', networkTraffic[i].message.clientFrame, 'arrived at', clock.frame);
					networkTraffic[i].client.conn.buffer({
						type: 'ping',
						version: networkTraffic[i].message.version,
						clientFrame: networkTraffic[i].message.clientFrame,
						serverFrame: clock.frame
					});
				}
				else if(networkTraffic[i].message.type === 'request-simulation-state') {
					networkTraffic[i].client.conn.buffer({
						type: 'simulation-state',
						state: simulation.getState(),
						frame: clock.frame
					});
				}
				else if(networkTraffic[i].message.type === 'request-player-config') {
					networkTraffic[i].client.conn.buffer({
						type: 'player-config',
						config: networkTraffic[i].client.player.getConfigParams()
					});
				}
			}
			networkTraffic = [];

			//update the simulation
			var actions;
			for(i = 0; i < clients.length; i++) {
				actions = clients[i].player.generateActions(clock.frame);
				for(j = 0; j < actions.length; j++) {
					simulationRunner.handleAction(actions[j], clock.frame);
					for(k = 0; k < clients.length; k++) {
						if(k !== i) {
							clients[k].conn.buffer({
								type: 'action',
								action: actions[j],
								frame: clock.frame,
								causedByClientInput: false
							});
						}
					}
					clients[i].conn.buffer({
						type: 'action',
						action: actions[j],
						frame: clock.frame,
						causedByClientInput: true
					});
				}
			}
			actions = gameMaster.generateActions(clock.frame);
			for(i = 0; i < actions.length; i++) {
				simulationRunner.handleAction(actions[i], clock.frame);
				for(j = 0; j < clients.length; j++) {
					clients[j].conn.buffer({
						type: 'action',
						action: actions[i],
						frame: clock.frame,
						causedByClientInput: false
					});
				}
			}
			simulationRunner.update();

			//flush network traffic
			for(i = 0; i < clients.length; i++) {
				clients[i].conn.flush();
			}
		});

		//kick it all off!
		clock.start();
		simulationRunner.reset(clock.frame, true);
		var initialActions = gameMaster.generateInitialActions(clock.frame);
		for(var i = 0; i < initialActions.length; i++) {
			simulationRunner.handleAction(initialActions[i], clock.frame);
		}
		connServer.startListening(socketServer);
	};
}); 