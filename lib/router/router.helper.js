var cluster = require('cluster');
var hub = require('clusterhub');
var prime = require('prime');
var object = require('prime/shell/object');

module.exports = {
	helperGetSocketById: function(io, sid) {

		var clients = io.sockets.clients(),
		client = null;
		object.each(clients, function(_client) {
        	if (_client.id === sid) return (client = _client);
    	});
    	if (!client) {
    		throw Error('cannot find client!')
    	}
		return client;
	},
	helperSocketIsAlive: function(io, sid) {
		// console.log(io.sockets.sockets[sid])
		// var clients = io.sockets.clients(); // works with socket.io-cloudhub
		return this.helperGetSocketById(io, sid) ? true : false;
	},
	// ok V3
	helperGetClusterId: function() {
		if (cluster.isWorker)
			return cluster.worker.id
		else
			return '99';
	},
	helperGetDispatcherRooms: function(io) {
		// console.log('manager sockets', io.of('/manager').rooms)
		// console.log('public sockets', io.of('/public').rooms)
		// console.log('#1', io.of('/manager').rooms)
		return io.sockets.manager.rooms;
	},	
	helperGetSession: function(socket, k) {
		if (socket && socket.handshake && socket.handshake._Client) {
			return !k ? socket.handshake._Client._session : socket.handshake._Client._session[k];
		} else if (socket && socket._Client) {
			throw Error('this should never happen');
			return !k ? socket._Client.getSession() : socket._Client.getSession(k);
		}
	},
	helperSetIOEvent: function(socket, event, callback) {
		socket.on(event, callback);
	},
	helperSetSession: function(socket, k, v) {
		if (!socket || !socket.handshake || !socket.handshake._Client) throw Error('Invalid socket!');
		return (socket.handshake._Client.setSessionAttr(k, v)) ? true : false;
	},
	// Ok V3
	helperPropagateViaEmitter: function(io, socket, eventType, eventPayload) {
		logger.debug('CID: '+this._cid+' | helperPropagateViaEmitter start');
		if (!eventPayload.dispatchers && type(eventPayload.dispatchers) != 'array') {
			logger.warn('CID: '+this._cid+' | helperPropagateViaEmitter payload has no dispatchers');
			return this;
		}
		// eventPayload.socket = socket; ???
		eventPayload.endpointSrc = this.helperGetSocketEndpoint(socket);
		eventPayload.room = this.helperGetSession(socket, 'eventHash');
		eventPayload.dispatchers.forEach(function(dispatcher) {
			var events = {'shell': 'Shell', 'command': 'Command', 'option': 'Option'};
			logger.info('CID: '+this._cid+' | helperPropagateViaEmitter propagating from '+events[eventType]+' to "'+dispatcher+'" for socket '+socket.id);
			eventPayload.endpointDst = '/'+dispatcher;
			this.helperPropagateEmitterEvent(events[eventType], eventType, eventPayload);
		}, this);
		logger.debug('CID: '+this._cid+' | helperPropagateViaEmitter stop');
		return this;
	},

	// OK V3
	helperPropagateEmitterEvent: function(event, eventType, eventPayload) {
		console.log('propage.. start '+event+' '+eventType)
		var payload = {'eventType': eventType, 'eventPayload': eventPayload, 'eventWorker': this._cid};
		if (this._cid == 99) {
			console.log('emit to '+event);
			// console.log(event)
			this._emitter.emit(event, payload);
		} else if (this._cid != 99) {
			console.log('whaatt??')
			// hub.emitLocal(event, payload);
			hub.emitRemote(event, payload);
		} else
			throw Error('This should not happen!');
		console.log('propage.. end')
	},
	// OK V3
	helperSetEmitterEvent: function(event, callback) {
		if (this._cid == 99)
			this._emitter.on(event, callback);
		else
			hub.on(event, callback);
	},
	// OK V3
	helperGetSocketEndpoint: function(socket) {
		if (socket.flags.endpoint) return socket.flags.endpoint;


		var endpoint = this.helperGetSession(socket, 'endpoint');
		if (!endpoint) {
			console.log(socket);
			console.log('spacer')
			console.log('spacer')
			console.log('spacer')
			throw Error('cannot get namespace!');
		}
		return endpoint;
	},
	helperSetClientSlide: function(io, socket, payload) {

		this.helperSetSession(socket, 'slide', payload);
		// this.cachePurge(socket);
	},
	helperStorePublicContent: function(io, socket, payload) {
		console.log('received')
		var backend = require('../backend.js');
		var callback = function(result)  {
			console.log('server reult !')
			console.log(result);
		}
		delete payload.dispatchers;
		console.log('foo')
		this.backendSetPublicContent(socket, payload, callback);
	}
};