define([
	'net/startWebServer',
	'net/startSocketServer',
	'net/server',
	'shared/time/clock',
	'shared/game/Simulation',
	'shared/game/SimulationRunner'
], function(
	startWebServer,
	startSocketServer,
	connServer,
	clock,
	Simulation,
	SimulationRunner
) {
	return function main() {
		//create the simulation
		var simulation = new Simulation();
		var simulationRunner = new SimulationRunner({
			simulation: simulation,
			framesOfHistory: 5
		});

		//start server
		var webServer = startWebServer();
		var socketServer = startSocketServer(webServer);

		//handle network events
		var networkTraffic = [];
		connServer.on('connect', function(conn) {
			conn.on('receive', function(msg) {
				networkTraffic.push({
					conn: conn,
					message: msg
				});
			});
		});

		//handle the update loop
		clock.on('tick', function() {
			//respond to network traffic
			for(var i = 0; i < networkTraffic.length; i++) {
				if(networkTraffic[i].message.type === 'ping') {
					networkTraffic[i].conn.buffer({
						type: 'ping',
						version: networkTraffic[i].message.version,
						clientFrame: networkTraffic[i].message.clientFrame,
						serverFrame: clock.frame
					});
				}
				else if(networkTraffic[i].message.type === 'request-simulation-state') {
					networkTraffic[i].conn.buffer({
						type: 'simulation-state',
						state: simulation.getState(),
						frame: clock.frame
					});
				}
			}
			networkTraffic = [];

			//update the simulation
			if(clock.frame % 30 === 0) {
				var entity = simulationRunner.getState().entities[0];
				var action = {
					type: 'entity-action',
					entityId: entity.id,
					action: {
						type: 'change-dir',
						moveX: -entity.state.moveX,
						moveY: -entity.state.moveY
					}
				};
				simulationRunner.handleAction(action, clock.frame);
				for(i = 0; i < connServer.connections.length; i++) {
					connServer.connections[i].buffer({
						type: 'action',
						action: action,
						frame: clock.frame
					});
				}
			}
			simulationRunner.update();

			//flush network traffic
			for(i = 0; i < connServer.connections.length; i++) {
				connServer.connections[i].flush();
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