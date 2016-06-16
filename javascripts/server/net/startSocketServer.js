define([
	'socket.io'
], function(
	io
) {
	return function startSocketServer(webServer) {
		return io(webServer);
	};
});