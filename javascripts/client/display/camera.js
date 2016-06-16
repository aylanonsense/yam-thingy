define([
	'config',
	'geom/Vector'
], function(
	config,
	Vector
) {
	return {
		pos: new Vector(config.CANVAS_WIDTH / 2, config.CANVAS_HEIGHT / 2),
		zoom: 1
	};
});