define([
	'net/ConnectionServer',
	'net/Client',
	'shared/util/EventHelper'
], function(
	ConnectionServer,
	Client,
	EventHelper
) {
	function ClientServer(params) {
		this.clients = [];
		this._simulation = params.simulation;
		this._connServer = new ConnectionServer({
			socketServer: params.socketServer
		});
		this._events = new EventHelper([ 'connect' ]);

		//bind event handlers
		this._connServer.on('connect', function(conn) {
			var client = new Client({
				conn: conn,
				simulation: this._simulation
			});
			this.clients.push(client);
			client.on('disconnect', function() {
				this.clients = this.clients.filter(function(client2) {
					return !client2.sameAs(client);
				});
			}, this);
			this._events.trigger('connect', client);
		}, this);
	}
	ClientServer.prototype.startListening = function() {
		this._connServer.startListening(this._socketServer);
	};
	ClientServer.prototype.sendToAll = function(msg) {
		for(var i = 0; i < this.clients.length; i++) {
			this.clients[i].send(msg);
		}
	};
	ClientServer.prototype.sendToAllExcept = function(msg, client) {
		for(var i = 0; i < this.clients.length; i++) {
			if(!this.clients[i].sameAs(client)) {
				this.clients[i].send(msg);
			}
		}
	};
	ClientServer.prototype.bufferToAll = function(msg) {
		for(var i = 0; i < this.clients.length; i++) {
			this.clients[i].buffer(msg);
		}
	};
	ClientServer.prototype.bufferToAllExcept = function(msg, client) {
		for(var i = 0; i < this.clients.length; i++) {
			if(!this.clients[i].sameAs(client)) {
				this.clients[i].buffer(msg);
			}
		}
	};
	ClientServer.prototype.flushAll = function() {
		for(var i = 0; i < this.clients.length; i++) {
			this.clients[i].flush();
		}
	};
	ClientServer.prototype.on = function(eventName, callback, ctx) {
		return this._events.on.apply(this._events, arguments);
	};
	ClientServer.prototype.isListening = function() {
		return this._connServer.isListening();
	};
	return ClientServer;
});