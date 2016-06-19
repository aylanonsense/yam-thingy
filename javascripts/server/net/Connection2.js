define([
	'net/Connection',
	'shared/util/EventHelper'
], function(
	Connection,
	EventHelper
) {
	function Connection2(socket) {
		var self = this;
		this._conn = new Connection(socket);
		this._events = new EventHelper([ 'receive', 'disconnect' ]);
		this._conn.on('receive', function(msg) {
			if(msg.type === 'message') {
				this._events.trigger('receive', msg.message);
			}
		}, this);
		this._conn.on('disconnect', function() {
			this._events.trigger('disconnect');
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
	Connection2.prototype.disconnect = function(permanently) {
		this._conn.disconnect(permanently);
	};
	Connection2.prototype.isConnected = function() {
		return this._conn.isConnected();
	};
	Connection2.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	Connection2.prototype.sameAs = function(other) {
		return this._conn.sameAs(other._conn);
	};
	return Connection2;
});