define({
	//display
	CANVAS_WIDTH: 600,
	CANVAS_HEIGHT: 400,

	//network
	LOG_NETWORK_TRAFFIC: false,
	FAKE_LAG_MILLISECONDS: 165, //roundtrip time
	FAKE_LAG_VARIATION: 0.15, //0 no variation, 1 anywhere from no to double lag
	PINGS_TO_STORE: 20,
	MILLISECONDS_BETWEEN_PINGS: 250,
	MILLISECONDS_BETWEEN_PINGS_INITIALLY: 100,
	LATENCY_BUFFER: 1, //positive: adds latency
	CLOCK_OFFSET: -1, //negative: less latency more rewinds, positive: more latency fewer rewinds
	MAX_INPUT_LATENCY: 4,

	//input
	LOG_KEY_EVENTS: false,
	KEY_BINDINGS: {
		38: "UP", 87: "UP",
		37: "LEFT", 65: "LEFT",
		40: "DOWN", 83: "DOWN",
		39: "RIGHT", 68: "RIGHT",
		69: "USE" //E key
	}
});