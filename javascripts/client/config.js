define({
	//display
	CANVAS_WIDTH: 800,
	CANVAS_HEIGHT: 600,

	//network
	LOG_NETWORK_TRAFFIC: false,
	FAKE_LAG_MILLISECONDS: 165, //roundtrip time
	FAKE_LAG_VARIATION: 0.15, //0 no variation, 1 anywhere from no to double lag
	PINGS_TO_STORE: 20,
	MILLISECONDS_BETWEEN_PINGS: 250,
	MILLISECONDS_BETWEEN_PINGS_INITIALLY: 100,

	//input
	LOG_KEY_EVENTS: false,
	KEY_BINDINGS: {
		38: "UP", 87: "UP",
		37: "LEFT", 65: "LEFT",
		40: "DOWN", 83: "DOWN",
		39: "RIGHT", 68: "RIGHT"
	}
});