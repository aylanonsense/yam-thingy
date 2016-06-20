define([
	'config',
	'display/draw'
], function(
	config,
	draw
) {
	function SimulationRenderer(params) {
		this.simulation = params.simulation;
		this.prediction = params.prediction;
	}
	SimulationRenderer.prototype.render = function() {
		var i, entity;
		for(var i = 1; i < 20; i++) {
			draw.line(0, config.CANVAS_HEIGHT * (i / 20),
				config.CANVAS_WIDTH, config.CANVAS_HEIGHT * (i / 20),
				{ stroke: '#555', thickness: 1, fixed: true });
		}
		for(i = 1; i < 20; i++) {
			draw.line(config.CANVAS_WIDTH * (i / 20), 0,
				config.CANVAS_WIDTH * (i / 20), config.CANVAS_HEIGHT,
				{ stroke: '#555', thickness: 1, fixed: true });
		}
		for(i = 0; i < this.simulation.entities.length; i++) {
			entity = this.simulation.entities[i];
			if(entity.type === 'Square') {
				draw.rect(entity.x - 10, entity.y - 10, 20, 20, { stroke: '#f00', thickness: 1 });
			}
		}
		for(i = 0; i < this.prediction.entities.length; i++) {
			entity = this.prediction.entities[i];
			if(entity.type === 'Square') {
				draw.rect(entity.x - 10, entity.y - 10, 20, 20, { fill: '#f00' });
			}
		}
	};
	return SimulationRenderer;
});