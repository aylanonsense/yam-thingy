define([
	'config',
	'display/draw',
	'display/canvas',
	'shared/time/clock',
	'shared/game/Simulation',
	'shared/game/SimulationRunner',
	'display/SimulationRenderer',
	'shared/input/InputStream',
	'input/keyboard',
	'shared/game/player/Player',
	'shared/game/player/GameMaster'
], function(
	config,
	draw,
	canvas,
	clock,
	Simulation,
	SimulationRunner,
	SimulationRenderer,
	InputStream,
	keyboard,
	Player,
	GameMaster
) {
	return function main() {
		var nextActionId = 0;
		function addIdsToActions(actions) {
			for(var i = 0; i < actions.length; i++) {
				actions[i].id = nextActionId++;
			}
			return actions;
		}

		//create the simulation
		var simulation = new Simulation();
		var simulationRunner = new SimulationRunner({
			simulation: simulation,
			framesOfHistory: 1
		});

		//create the player and the game master
		var inputStream = new InputStream();
		var player = new Player({
			simulation: simulation
		});
		var gameMaster = new GameMaster({
			simulation: simulation
		});

		//create the renderer
		var simulationRenderer = new SimulationRenderer({
			primarySimulation: simulation,
			secondarySimulation: null
		});

		//resize the canvas
		canvas.setAttribute('width', config.CANVAS_WIDTH);
		canvas.setAttribute('height', config.CANVAS_HEIGHT);

		//the update loop
		clock.on('tick', function() {
			//apply player actions to the simulation
			var inputs = inputStream.popInputs();
			player.update(inputs);
			var actions = player.popActions();
			if(actions.length > 0) {
				addIdsToActions(actions);
				simulationRunner.scheduleActions(actions, clock.frame);
			}

			//apply game master actions to the simulation
			gameMaster.update();
			actions = gameMaster.popActions();
			if(actions.length > 0) {
				addIdsToActions(actions);
				simulationRunner.scheduleActions(actions, clock.frame);
			}

			//update the simulation
			simulationRunner.update();

			//clear canvas
			draw.rect(0, 0, config.CANVAS_WIDTH, config.CANVAS_HEIGHT, { fill: '#000', fixed: true });

			//render the simulation
			simulationRenderer.render();
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
				inputStream.scheduleInput(input, clock.frame + 1, 0);
			}
		});

		//kick it all off!
		clock.start();
		simulationRunner.reset(clock.frame);
		gameMaster.reset();
		gameMaster.addPlayer(player);
		var initialActions = gameMaster.popActions();
		if(initialActions.length > 0) {
			addIdsToActions(initialActions);
			simulationRunner.scheduleActions(initialActions, clock.frame);
		}
	};
});