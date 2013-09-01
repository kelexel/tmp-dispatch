var prime = require('prime');
var type = require('prime/type');
var slide = new(require(__dirname+'/slide.js'));
var async = require('async');

module.exports = {
	frontendSetup: function(io) {
		var optionsCallback = this.frontendPropagateToUI.bind(this, io);
		this.eventsInternalSetup('Option', optionsCallback);

		var commandCallback = this.frontendPropagateToUI.bind(this, io);
		this.eventsInternalSetup('Command', commandCallback);

		logger.debug('CID: '+this._cid+' | frontendEmitterSetup: ok');
	},

	frontendAttach: function(io, socket) {
		var endpoint = this.helperGetSocketEndpoint(socket);
		if (endpoint != 'shell') {
			var optionsCallback = this._frontendOptionsListener.bind(this, io, socket);
			socket.on('setSlideOption', optionsCallback);

			var commandCallback = this._frontendCommandsListener.bind(this, io, socket);
			socket.on('sendCommand', commandCallback);
			logger.debug('CID: '+this._cid+' | frontendAttach: ok');
		}
	},
	_frontendOptionsListener: function(io, socket, payload) {
		logger.debug('CID: '+this._cid+' | frontend setOption received', payload);
		var session = this.helperGetSession(socket);
		async.waterfall([
			slide.setOption.bind(slide, socket, payload),
			function(data) {
				try {
					if (!data || !data.status || data.status != 'ok') {
						throw Error('Invalid setSlideOption response');
					} else 
						payload.response = data;
				} catch(e) {
					payload.response = {'status': 'error', 'log': 'Something went wrong while setting the option!'};
				}
				payload.socketId = socket.id;
				payload.endpointSrc = this.helperGetSocketEndpoint(socket);
				payload.room = this.helperGetSession(socket, 'eventHash');
				logger.debug('CID: '+this._cid+' | propagating option internally', payload);
				this.eventsInternalPropagate('Option', 'option', payload);
			}.bind(this)
		], function(err, res) {
			if (err) throw Error(err);
			logger.debug('option was set!');
		});
	},

	_frontendCommandsListener: function(io, socket, payload) {
		 logger.debug('CID: '+this._cid+' | frontend sendCommand received ' +payload.command+' from '+socket.id);
			payload.socketId = socket.id;
			payload.endpointSrc = this.helperGetSocketEndpoint(socket);
			payload.room = this.helperGetSession(socket, 'eventHash');

		if (payload.command == 'storePublicContent') {
			this.helperStorePublicContent(io, socket, payload)
			return;
		}
		else if (payload.command == 'ping') {
			socket.emit('command', {'command': 'pong'});
			return;
		}
		else if (payload.command == 'setSlide') {
			this.eventsInternalPropagate('Master', 'setSlide', {'socketId': socket.id, 'commandArgs': {'slide': payload.commandArgs.slide}});
			return;
		} else if (payload.dispatchers == 1 && payload.dispatchers.indexOf('public') == 0) {
			console.log('what are you trying to do ?!');
			return;
		}
		logger.debug('CID: '+this._cid+' _frontendCommandsListener '+socket.id+' ok');
		this.eventsInternalPropagate('Command', 'command', payload);
	},
	frontendPropagateToUI: function(io, payload) {
		if (!this._isMaster) {
			return;
		}
		logger.info('CID: '+this._cid+' socketPropagateEventToUI received');

		if (!payload) throw Error('Invalid Payload');
		if (!io) throw Error('Invalid IO');

		if (!payload.eventType) throw Error('Invalid eventType');
		if (!payload.eventPayload) throw Error('Invalid eventPayload');
		// if (!payload.eventPayload.endpointDst) throw Error('Invalid endpointDst');
		if (!payload.eventPayload.room) throw Error('Invalid room');


		var room = payload.eventPayload.room;
		var endpoint;
		var dispatchers = payload.eventPayload.dispatchers;
		delete payload.eventPayload.dispatchers;
		payload.eventPayload.timestamp = Math.floor(Date.now() / 1000);

		dispatchers.forEach(function(dispatcher) {
			endpoint = '/'+dispatcher;
			logger.verbose('CID: '+this._cid+' sending to '+endpoint+' '+room+' '+payload.eventType);
			io.of(endpoint).in(room).emit(payload.eventType, payload.eventPayload);
			logger.debug('CID: '+this._cid+' socketPropagateEventToUI ok');
		}, this);
	}
}