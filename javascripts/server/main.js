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
		var i, j, k;

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
			});
		});

		//handle the update loop
		clock.on('tick', function() {
			//respond to network traffic
			for(var i = 0; i < networkTraffic.length; i++) {
				if(networkTraffic[i].message.type === 'ping') {
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
			}
			networkTraffic = [];

			//update the simulation
			var actions;
			for(i = 0; i < clients.length; i++) {
				actions = clients[i].player.popActions(clock.frame);
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
			actions = gameMaster.popActions(clock.frame);
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
		connServer.startListening(socketServer);
		simulationRunner.setState({
			entities: [
				{ id: 5, type: 'Square', state: { x: 200, y: 100, moveX: 1, moveY: 1 } },
				{ id: 7, type: 'Square', state: { x: 600, y: 500, moveX: 0, moveY: 0 } }
			]
		}, clock.frame);
	};
}); 