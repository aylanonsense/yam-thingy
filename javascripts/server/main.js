define([
	'net/startWebServer',
	'net/startSocketServer',
	'net/server',
	'time/clock'
], function(
	startWebServer,
	startSocketServer,
	connServer,
	clock
) {
	return function main() {
		//start server
		var webServer = startWebServer();
		var socketServer = startSocketServer(webServer);

		//listen for clients
		connServer.startListening(socketServer);
		connServer.on('connect', function(conn) {
			var timeOfLastLatencyAdjustment = clock.time;
			conn.on('receive', function(msg) {
				if(msg.type === 'input') {
					console.log('input: ' + (msg.frame - (clock.frame + 1)));
					/*if(clock.time > timeOfLastLatencyAdjustment + 2000 && msg.frame - (clock.frame + 1) < 0) {
						timeOfLastLatencyAdjustment = clock.time;
						conn.send({
							type: 'latency-adjustment',
							frames: 1
						});
					}*/
				}
			});
		});

		//kick off update loop
		clock.on('tick', function(ms) {
			//TODO
			if(clock.frame % 60 === 0) {
				for(var i = 0; i < connServer.connections.length; i++) {
					connServer.connections[i].send({
						type: 'latency-test',
						frame: clock.frame
					});
				}
				// console.log(clock.frame / 60, Math.floor(clock.time), 1000 * clock.frame / clock.time);
			}
		});
		clock.start();
	};
}); 