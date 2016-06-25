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
		var i, entity, color;
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
			if(entity.type === 'Square') { color = '#f00'; }
			else if(entity.type === 'SyncedCrate') { color = '#0f0'; }
			else if(entity.type === 'DesyncedCrate') { color = '#00f'; }
			else { throw new Error('Unable to render entity of type "' + entity.type + '"'); }
			if(entity.type === 'Square' && entity.framesOfAttackLeft > 0) {
				draw.rect(entity.x - entity.attackRange / 2, entity.y - entity.attackRange / 2,
					entity.attackRange, entity.attackRange, { stroke: '#ff0', thickness: 1 });
			}
			draw.rect(entity.x - entity.width / 2, entity.y - entity.height / 2,
				entity.width, entity.height, { stroke: color, thickness: 2 });
		}
		for(i = 0; i < this.prediction.entities.length; i++) {
			entity = this.prediction.entities[i];
			if(entity.type === 'Square') { color = '#f00'; }
			else if(entity.type === 'SyncedCrate') { color = '#0f0'; }
			else if(entity.type === 'DesyncedCrate') { color = '#00f'; }
			else { throw new Error('Unable to render entity of type "' + entity.type + '"'); }
			if(entity.type === 'Square' && entity.framesOfAttackLeft > 0) {
				draw.rect(entity.x - entity.attackRange / 2, entity.y - entity.attackRange / 2,
					entity.attackRange, entity.attackRange, { fill: 'rgba(255, 255, 0, 0.5)' });
			}
			draw.rect(entity.x - entity.width / 2, entity.y - entity.height / 2,
				entity.width, entity.height, { fill: color });
		}
	};
	return SimulationRenderer;
});