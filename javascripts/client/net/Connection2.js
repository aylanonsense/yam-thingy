define([
	'net/Connection',
	'shared/util/EventHelper'
], function(
	Connection,
	EventHelper
) {
	function Connection2() {
		this._conn = new Connection();
		this._events = new EventHelper([ 'connect', 'receive', 'disconnect' ]);
		this._conn.on('connect', function(isReconnect) {
			this._events.trigger('connect', isReconnect);
		}, this);
		this._conn.on('receive', function(msg) {
			if(msg.type === 'message') {
				this._events.trigger('receive', msg.message);
			}
		}, this);
		this._conn.on('disconnect', function(isPermanent) {
			this._events.trigger('disconnect', isPermanent);
		}, this);
	}
	Connection2.prototype.buffer = function(msg) {
		this._conn.buffer({
			type: 'message',
			message: msg
		});
	};
	Connection2.prototype.flush = function() {
		this._conn.flush();
	};
	Connection2.prototype.send = function(msg) {
		this.buffer(msg);
		this.flush();
	};
	Connection2.prototype.connect = function() {
		this._conn.connect();
	};
	Connection2.prototype.disconnect = function() {
		this._conn.disconnect();
	};
	Connection2.prototype.reconnect = function() {
		this._conn.disconnect();
		this._conn.connect();
	};
	Connection2.prototype.isConnected = function() {
		return this._conn.isConnected();
	};
	Connection2.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	return Connection2;
});