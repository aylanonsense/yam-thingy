define([
	'net/Connection2',
	'shared/util/EventHelper'
], function(
	Connection2,
	EventHelper
) {
	function ConnectionServer() {
		this._events = new EventHelper([ 'connect' ]);
		this.connections = [];
	}
	ConnectionServer.prototype.startListening = function(socketServer) {
		var self = this;

		//start listening for connections
		socketServer.on('connection', function(socket) {
			var conn = new Connection2(socket);
			self.connections.push(conn);

			//remove connection from list of connections on disconnect
			conn.on('disconnect', function() {
				this.connections = this.connections.filter(function(otherConnection) {
					return !conn.sameAs(otherConnection);
				});
			}, self);

			self._events.trigger('connect', conn);
		});
	};
	ConnectionServer.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	return ConnectionServer;
});