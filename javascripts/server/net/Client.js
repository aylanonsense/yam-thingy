define([
	'shared/game/player/Player',
	'shared/input/InputStream'
], function(
	Player,
	InputStream
) {
	function Client(params) {
		this._conn = params.conn;
		this.player = new Player({
			simulation: params.simulation
		});
		this.inputStream = new InputStream();
	}
	Client.prototype.buffer = function(msg) {
		this._conn.buffer(msg);
	};
	Client.prototype.flush = function() {
		this._conn.flush();
	};
	Client.prototype.send = function(msg) {
		this._conn.send(msg);
	};
	Client.prototype.disconnect = function(permanently) {
		this._conn.disconnect(permanently);
	};
	Client.prototype.isConnected = function() {
		this._conn.isConnected();
	};
	Client.prototype.on = function(eventName, callback, ctx) {
		this._conn.on(eventName, callback, ctx);
	};
	Client.prototype.sameAs = function(other) {
		return this._conn.sameAs(other._conn);
	};
	return Client;
});