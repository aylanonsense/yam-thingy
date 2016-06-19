define([
	'display/draw'
], function(
	draw
) {
	function SimulationRenderer(params) {
		this.simulation = params.simulation;
	}
	SimulationRenderer.prototype.render = function() {
		for(var i = 0; i < this.simulation.entities.length; i++) {
			var entity = this.simulation.entities[i];
			if(entity.type === 'Square') {
				draw.rect(entity.x - 10, entity.y - 10, 20, 20, { fill: '#f00' });
			}
		}
	};
	return SimulationRenderer;
});