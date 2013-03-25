var prime = require('prime');
var type = require('prime/type');
var Emitter = require('prime/emitter');
var emitter = new Emitter()
var Map = require('prime/map')
var map = Map()

module.exports = prime({
	_sockets: {},
	_options: {},
	constructor: function(io, server) {
		// ensure dispatcher Type is set
		var _dispatcherTyper = this._dispatcherTyper ? this._dispatcherTyper : 'public';
		this._companyPrefix = this._companyPrefix ? this._companyPrefix : 'ConferencePublic';
		emitter.on('dispatch'+_dispatcherTyper+'Options', this.socketPropagateEventToUI.bind(this));

		// this._ConferencePublic
		var namespace = '/'+_dispatcherTyper;
		logger.info('Configuring namespace:', namespace)
		io.configure(function() {
			io.enable('browser client etag');          // apply etag caching logic based on version number
			io.enable('browser client gzip');          // gzip the file	
			io.set('log level', 1);
		});

		io.configure('prod', function () { 
			logger.info('Starting in production mode');
			io.enable('browser client minification');
			io.enable('browser client gzip');          // gzip the file	
			io.enable('browser client etag');
			// io.set('transports', ['websocket']);
		});


		io.configure('dev', function(){
			logger.info('Starting in developmment mode');
			// io.set('transports', ['websocket']);
		});

		io.of(namespace)
			.authorization(function(data, callback) {
				var s = require(__dirname+'/session.js');
				s.initialized = new s.Session();
				s.initialized.authorize(_dispatcherTyper, data, callback);
			})
		.on('connection', this.socketOnConnect.bind(this, server, io));
	},

	logout: function() {
	},

// Socket.io related
	socketOnConnect: function(server, io, socket) {
		// this._sockets[socket.id] = socket;
		socket.handshake._session.endpoint = socket.flags.endpoint;
		var session = socket.handshake._session;
		if (!session.eventHash) return this.logout();
		socket.join(session.eventHash);
		logger.info('+ New client', {socket: socket.id, sessionId: session.token, interface: session.interface, endpoint: session.endpoint, room: session.eventHash});
		var r = {'state': 'ok'};
		if (!session || !session.token || !session.cookie)
			r.auth = false;
		else {
			r.auth = true;
			r.slide = session.slide ? session.slide : false;
		}

		socket.emit('welcome', r);
		this.socketAttachEvents(server, io, socket);
	},
	socketAttachEvents: function(server, io, socket) {},
	socketSetOptionsListener: function(server, io, socket, payload) {
		logger.debug('listener setOption received', payload.toString());
		var session = socket.handshake._session;
		var backend = require(__dirname+'/backend.js');
		var callback = function(data) {
			try {
					if (!data || !data.status || data.status != 'ok') throw Error('Invalid setSlideOption response');
				} catch(e) {
					logger.error(data);
					return;
				}
			var message = payload;
			message.response = data;
			// emitter.emit('message', message);
			this.eventPropagateToDispatchers(server, io, socket, 'option', message);
		}.bind(this);

		backend.asyncSendSlideOption(socket, payload, callback);
	},

	socketSendCommandListener: function(server, io, socket, payload) {
		logger.debug('listener setOption received', payload);
		var session = socket.handshake._session;
		var backend = require(__dirname+'/backend.js');

		// var message = payload;
		this.eventPropagateToDispatchers(server, io, socket, 'command', payload);
	},

// Socket emitter to all sockets of a given event
	// socketEmitToClients: function(message) {
	// 	// if no one is connected, just do nothing, else, emit the message
	// 	if (type(this._sockets) == 'object' && _(this._sockets).count() > 0) 
	// 		_.each(this._sockets, function(socket) {
	// 			socket.emit('message', message);
	// 		});
	// },
// Server emitter to all interfaces of a given event
	eventPropagateToDispatchers: function(server, io, socket, eventType, payload) {
		logger.debug('Trying to propagate payload to all dispatchers');
		if (!payload.dispatchers && type(payload.dispatchers) != 'array') {
			logger.debug('Payload has no dispatchers to emit to !!!');
			return this;
		}
		_(payload.dispatchers).each(function(dispatcher) {
			logger.info('> Propagating message payload to dispatch'+dispatcher+'Options', payload)
			emitter.emit('dispatch'+dispatcher+'Options', io, socket, eventType, payload);
		}, this);
		return this;
	},
	socketPropagateEventToUI: function(io, socket, eventType, payload) {
		logger.debug(this._dispatcherTyper+' socketPropagateEventToUI', eventType, payload);
		try { var session = socket.handshake._session; }
		catch(e) {
			// socket probably died
			return;
		}
		// var cnt = _(this._sockets).count();
		// this.debug('dispatcher '+this._dispatcherTyper+' has '+cnt+' socket(s)');
		// this.debug(payload)
		delete payload.dispatchers;
		logger.debug(this._dispatcherTyper+' -> proto emit to ', session.eventHash);
		logger.verbose('found '+_(io.of(session.endpoint).clients(session.eventHash)).count()+' sockets in endpoint '+this._dispatcherTyper+' @'+session.eventHash);
		io.of('/'+this._dispatcherTyper).in(session.eventHash).emit(eventType, payload);
		logger.debug('socketPropagateEventToUI OK');
	}
//
});