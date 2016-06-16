define([
	'config',
	'shared/util/EventHelper'
], function(
	config,
	EventHelper
) {
	var nextConnId = 0;

	function Connection(socket) {
		var self = this;
		this._connId = nextConnId++;
		this._bufferedMessages = [];
		this._events = new EventHelper([ 'receive', 'disconnect' ]);

		//handle the socket
		this._socket = socket;
		this._isConnected = true;
		if(config.LOG_NETWORK_TRAFFIC) { console.log('[' + this._connId + '] connected'); }
		this._socket.on('messages', function(messages) {
			for(var i = 0; i < messages.length; i++) {
				if(config.LOG_NETWORK_TRAFFIC) { console.log('[' + self._connId + '] received:', messages[i]); }
				self._events.trigger('receive', messages[i]);
			}
		});
		this._socket.on('disconnect', function() {
			self._isConnected = false;
			if(config.LOG_NETWORK_TRAFFIC) { console.log('[' + self._connId + '] disconnected'); }
			self._events.trigger('disconnect');
		});
	}
	Connection.prototype.buffer = function(msg) {
		this._bufferedMessages.push(msg);
	};
	Connection.prototype.flush = function() {
		if(this._bufferedMessages.length > 0) {
			var messages = this._bufferedMessages;
			this._bufferedMessages = [];
			for(var i = 0; i < messages.length; i++) {
				if(config.LOG_NETWORK_TRAFFIC) { console.log('[' + this._connId + '] sent:', messages[i]); }
			}
			this._socket.emit('messages', messages);
		}
	};
	Connection.prototype.send = function(msg) {
		this.buffer(msg);
		this.flush();
	};
	Connection.prototype.disconnect = function(permanently) {
		if(permanently) {
			this._socket.emit('force-disconnect');
		}
		this._socket.disconnect();
	};
	Connection.prototype.isConnected = function() {
		return this._isConnected;
	};
	Connection.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	Connection.prototype.sameAs = function(other) {
		return other && other._connId === this._connId;
	};
	return Connection;
});