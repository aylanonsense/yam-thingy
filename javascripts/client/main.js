define([
	'config',
	'display/draw',
	'display/canvas',
	'time/clock',
	'net/conn',
	'net/pinger',
	'net/timeSyncer',
	'display/consoleUI',
	'input/keyboard'
], function(
	config,
	draw,
	canvas,
	clock,
	conn,
	pinger,
	timeSyncer,
	consoleUI,
	keyboard
) {
	return function main() {
		var inputFrameLatency = 4;

		//resize the canvas
		canvas.setAttribute('width', config.CANVAS_WIDTH);
		canvas.setAttribute('height', config.CANVAS_HEIGHT);

		//handle the update loop
		clock.on('server-tick', function(ms) {
			//ping the server every so often
			if(pinger.isRunning()) {
				pinger.update(ms);
			}

			//flush any messages
			conn.flush();
		});
		clock.on('client-tick', function(ms) {
			//clear canvas
			draw.rect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT, { fill: '#000', fixed: true });

			//draw console
			consoleUI.render();

			if(pinger.isCalibrated() && timeSyncer.isCalibrated()) {
				if((clock.clientFrame + timeSyncer.frameOffset) % 60 === 0) {
					/*console.log((clock.clientFrame + timeSyncer.frameOffset) / 60,
						Math.floor(clock.clientTime + timeSyncer.timeOffset),
						1000 * (clock.clientFrame + timeSyncer.frameOffset) / (clock.clientTime + timeSyncer.timeOffset));*/
				}
			}

			//draw the network graph
			if(pinger.isRunning()) {
				pinger.render();
			}
		});

		//calibrate network latency
		pinger.on('calibrated', function() {
			consoleUI.write('Calibrated latency: ' + Math.ceil(pinger.timeLatency) + 'ms');
			if(timeSyncer.isCalibrated()) {
				consoleUI.write('Calibrated to ' + inputFrameLatency + ' frames of input latency and ' + pinger.frameLatency + ' frames of network latency');
			}
		});
		timeSyncer.on('calibrated', function() {
			consoleUI.write('Calibrated clock');
			if(pinger.isCalibrated()) {
				consoleUI.write('Calibrated to ' + inputFrameLatency + ' frames of input latency and ' + pinger.frameLatency + ' frames of network latency');
			}
		});
		//add network handlers
		conn.on('connect', function(isReconnect) {
			consoleUI.write(isReconnect ? 'Reconnected to server' : 'Connected to server');
			pinger.start();
			timeSyncer.start();
		});
		conn.on('disconnect', function(isPermanent) {
			consoleUI.write('Disconnected ' + (isPermanent ? 'permanently ' : '') + 'from server...');
			pinger.stop();
			timeSyncer.stop();
		});
		conn.on('ping', function(timeSent, frameSent, serverTime, serverFrame, timeReceived, frameReceived) {
			pinger.handlePing(timeSent, frameSent, serverTime, serverFrame, timeReceived, frameReceived);
			timeSyncer.handlePing(timeSent, frameSent, serverTime, serverFrame, timeReceived, frameReceived);
		});
		conn.on('receive', function(msg) {
			if(msg.type === 'latency-adjustment') {
				// console.log(msg);
			}
			else if(msg.type === 'latency-test') {
				var nextServerFrame = clock.clientFrame + timeSyncer.frameOffset + 1;
				var nextClientFrame = nextServerFrame - Math.ceil((pinger.frameLatency + config.EXTRA_FRAME_LATENCY_BUFFER) / 2);
				console.log('latency-test: ' + (msg.frame - nextClientFrame));
			}
		});

		//handle inputs
		keyboard.on('key-event', function(key, isDown) {
			if(pinger.isCalibrated() && timeSyncer.isCalibrated()) {
				var state = keyboard.getState();
				var nextServerFrame = clock.clientFrame + timeSyncer.frameOffset + 1;
				var nextClientFrame = nextServerFrame - Math.ceil((pinger.frameLatency + config.EXTRA_FRAME_LATENCY_BUFFER) / 2);
				//the frame on which this input will occur on the local prediction
				var frameToApplyInput = nextClientFrame + inputFrameLatency;
				//the frame on which this input will actually occur
				var remoteFrame = nextServerFrame + Math.floor((pinger.frameLatency + config.EXTRA_FRAME_LATENCY_BUFFER) / 2);
				conn.send({
					type: 'input',
					key: key,
					isDown: isDown,
					state: state,
					frame: remoteFrame
				});
			}
		});

		//start it all
		clock.start();
		conn.connect();
	};
});