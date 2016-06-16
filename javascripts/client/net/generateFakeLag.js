define([
	'config'
], function(
	config
) {
	return function generateFakeLag() {
		var mult = (1 - config.FAKE_LAG_VARIATION) + 2 * config.FAKE_LAG_VARIATION * Math.random();
		return Math.round(config.FAKE_LAG_MILLISECONDS * mult / 2);
	};
});