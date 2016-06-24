define([
	'net/Connection2',
	'shared/util/EventHelper'
], function(
	Connection2,
	EventHelper
) {
	function ConnectionServer(params) {
		this.connections = [];
		this._socketServer = params.socketServer;
		this._isListening = false;
		this._events = new EventHelper([ 'connect' ]);
	}
	ConnectionServer.prototype.startListening = function() {
		if(!this._isListening) {
			this._isListening = true;
			var self = this;

			//start listening for connections
			this._socketServer.on('connection', function(socket) {
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
		}
	};
	ConnectionServer.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	ConnectionServer.prototype.isListening = function() {
		return this._isListening;
	};
	return ConnectionServer;
});