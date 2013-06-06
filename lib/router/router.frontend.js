var prime = require('prime');
var type = require('prime/type');
// var emitter = new (require('prime/emitter'));

module.exports = {
	frontendSetup: function(io) {
		var optionsCallback = this.frontendPropagateToUI.bind(this, io);
		this.helperSetEmitterEvent('Option', optionsCallback);
		// this._emitter.on(this._endpoint+'Option', optionsCallback);

		var commandCallback = this.frontendPropagateToUI.bind(this, io);
		this.helperSetEmitterEvent('Command', commandCallback);
		// this._emitter.on(this._endpoint+'Command', commandCallback);

		logger.debug('CID: '+this._cid+' | frontendEmitterSetup: ok');
	},

	frontendAttach: function(io, socket) {
		var endpoint = this.helperGetSocketEndpoint(socket);
		if (endpoint != 'shell') {
			var optionsCallback = this._frontendOptionsListener.bind(this, io, socket);
			this.helperSetIOEvent(socket, 'setSlideOption', optionsCallback);
			var commandCallback = this._frontendCommandsListener.bind(this, io, socket);
			this.helperSetIOEvent(socket, 'sendCommand', commandCallback);
			logger.debug('CID: '+this._cid+' | frontendAttach: ok');
		}
	},
	_frontendOptionsListener: function(io, socket, payload) {
		logger.debug('CID: '+this._cid+' | frontend setOption received', payload.toString());
		var session = this.helperGetSession(socket);
		var callback = function(data) {
			try {
				if (!data || !data.status || data.status != 'ok') throw Error('Invalid setSlideOption response');
			} catch(e) {
				logger.error(data);
				return;
			}
			// var message = payload;
			// message.response = data;
			// this.helperPropagateViaEmitter(io, socket, 'option', message);
			payload.response = data;
			payload.socketId = socket.id;
			this.helperPropagateViaEmitter(io, socket, 'option', payload);
		}.bind(this);

		// var backend = require(__dirname+'/../backend.js');
		// backend.asyncSendSlideOption(socket, payload, callback);
		this.backendSetSlideOption(socket, payload, callback);
	},

	_frontendCommandsListener: function(io, socket, payload) {
		logger.debug('CID: '+this._cid+' | frontend sendCommand received', payload);
		// var session = socket.handshake._session;
		// var backend = require(__dirname+'/backend.js');
		console.log('')
		console.log('')
		console.log('')
		console.log('')
		if (payload.command == 'storePublicContent') {
			this.helperStorePublicContent(io, socket, payload)
			return;
		}
		else if (payload.command == 'setSlide') {
			this.helperSetClientSlide(io, socket, payload);
			this.cacheRegister(io, socket);
			return;
		} else if (payload.dispatchers == 1 && payload.dispatchers.indexOf('public') == 0) {
			console.log('what are you trying to do ?!');
			return;
		}
		console.log('payloaddisp')
		console.log(payload);
		console.log('')
		console.log('')
		console.log('')
		console.log('')
		// payload.endpoint = this.helperGetSession(socket, 'eventHash');
		// payload.room = this.helperGetSocketEndpoint(socket);

		logger.debug('CID: '+this._cid+' _frontendCommandsListener '+socket.id+' ok');
			
		this.helperPropagateViaEmitter(io, socket, 'command', payload);
	},
	frontendPropagateToUI: function(io, payload) {
		if (!this.isMaster && this._cid != 99) return;
		// console.log(this._cid+' payload')
		// payload = eventPayload;
		// return;
		if (!payload) throw Error('Invalid Payload');
		if (!io) throw Error('Invalid IO');
		// var socket = this.helperGetSocketById(io, payload.eventPayload.socketId), eventType = payload.eventPayload.eventType, eventPayload = payload.eventPayload;
		// var endpoint = this.helperGetSocketEndpoint(socket);
		// if (!socket) throw Error('Invalid socket');
		// console.log(payload)
		if (!payload.eventType) throw Error('Invalid eventType');
		if (!payload.eventPayload) throw Error('Invalid eventPayload');
		if (!payload.eventPayload.endpointDst) throw Error('Invalid endpointDst');
		if (!payload.eventPayload.room) throw Error('Invalid room');


		// var session = this.helperGetSession(socket);
		var endpoint = payload.eventPayload.endpointDst;

		var room = payload.eventPayload.room;
		logger.debug('CID: '+this._cid+' '+endpoint+' socketPropagateEventToUI', payload.eventType, payload.eventPayload.valueOf());

		delete payload.eventPayload.dispatchers;
		payload.eventPayload.timestamp = Math.floor(Date.now() / 1000);
		// logger.debug('CID: '+this._cid+' '+endpoint+' -> proto emit to ', session.eventHash);
		// logger.verbose('CID: '+this._cid+' found '+_(io.of(session.endpoint).clients(session.eventHash)).count()+' sockets in endpoint '+endpoint+' @'+session.eventHash);
		console.log(' sending to '+endpoint+' '+room+' '+payload.eventType);
		io.of(endpoint).in(room).emit(payload.eventType, payload.eventPayload);
		logger.debug('CID: '+this._cid+' socketPropagateEventToUI OK');
	},
}