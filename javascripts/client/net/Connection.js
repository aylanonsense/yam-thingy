define([
	'socket.io',
	'config',
	'net/generateFakeLag',
	'shared/util/DelayQueue',
	'shared/util/EventHelper',
	'time/now'
], function(
	io,
	config,
	generateFakeLag,
	DelayQueue,
	EventHelper,
	now
) {
	//basic connection that incorporates fake lag into its methods
	function Connection() {
		this._socket = null;
		this._isConnecting = false;
		this._isConnected = false;
		this._isActuallyConnected = false;
		this._hasConnectedBefore = false;
		this._isPermanentlyDisconnected = false;
		this._bufferedMessages = [];
		this._events = new EventHelper([ 'connect', 'receive', 'disconnect' ]);

		//set up message queues (allows us to add fake lag)
		this._inbound = new DelayQueue();
		this._inbound.on('dequeue', function(evt) {
			if(evt.type === 'messages' && this._isConnected) {
				for(var i = 0; i < evt.messages.length; i++) {
					if(config.LOG_NETWORK_TRAFFIC) { console.log('received:', evt.messages[i]); }
					this._events.trigger('receive', evt.messages[i]);
				}
			}
			else if(evt.type === 'connect') {
				this._isConnected = true;
				this._isConnecting = false;
				if(config.LOG_NETWORK_TRAFFIC) { console.log(this._hasConnectedBefore ? 'reconnected' : 'connected'); }
				this._events.trigger('connect', this._hasConnectedBefore); //isReconnect
				this._hasConnectedBefore = true;
			}
			else if(evt.type === 'disconnect') {
				this._isConnected = false;
				this._isConnecting = false;
				this._outbound.empty();
				if(config.LOG_NETWORK_TRAFFIC) { console.log('disconnected'); }
				this._events.trigger('disconnect', this._isPermanentlyDisconnected);
			}
		}, this);
		this._outbound = new DelayQueue();
		this._outbound.on('dequeue', function(evt) {
			if(evt.type === 'messages' && this._isConnected && this._isActuallyConnected) {
				this._socket.emit('messages', evt.messages);
			}
			else if(evt.type === 'connect') {
				var self = this;
				this._socket = io();
				this._socket.on('connect', function() {
					self._isActuallyConnected = true;
					self._inbound.enqueue({ type: 'connect' }, now() + generateFakeLag());
				});
				this._socket.on('messages', function(messages) {
					self._inbound.enqueue({ type: 'messages', messages: messages }, now() + generateFakeLag());
				});
				this._socket.on('disconnect', function() {
					if(self._isActuallyConnected) {
						self._isActuallyConnected = false;
						self._inbound.enqueue({ type: 'disconnect' }, now() + generateFakeLag());
					}
				});
				this._socket.on('force-disconnect', function() {
					self._isPermanentlyDisconnected = true;
					self._socket.disconnect();
				});
			}
			else if(evt.type === 'disconnect') {
				this._isActuallyConnected = false;
				this._socket.disconnect();
			}
		}, this);
	}
	Connection.prototype.buffer = function(msg) {
		if(this._isConnected && this._isActuallyConnected) {
			this._bufferedMessages.push(msg);
		}
	};
	Connection.prototype.flush = function() {
		if(this._isConnected && this._isActuallyConnected && this._bufferedMessages.length > 0) {
			var messages = this._bufferedMessages;
			this._bufferedMessages = [];
			for(var i = 0; i < messages.length; i++) {
				if(config.LOG_NETWORK_TRAFFIC) { console.log('sent:', messages[i]); }
			}
			this._outbound.enqueue({ type: 'messages', messages: messages }, now() + generateFakeLag());
		}
	};
	Connection.prototype.send = function(msg) {
		this.buffer(msg);
		this.flush();
	};
	Connection.prototype.connect = function() {
		if(!this._isConnecting && !this._isConnected && !this._isPermanentlyDisconnected) {
			this._isConnecting = true;
			this._outbound.enqueue({ type: 'connect' }, now() + generateFakeLag());
		}
	};
	Connection.prototype.disconnect = function() {
		if(this.isConnecting || this._isConnected) {
			this._isConnecting = false;
			this._isConnected = false;
			if(config.LOG_NETWORK_TRAFFIC) { console.log('disconnected'); }
			this._outbound.enqueue({ type: 'disconnect' }, now() + generateFakeLag());
			this._events.trigger('disconnect', this._isPermanentlyDisconnected);
		}
	};
	Connection.prototype.isConnected = function() {
		return this._isConnected;
	};
	Connection.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	return Connection;
});