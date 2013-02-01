var prime = require('prime');
var type = require('prime/type');
var Emitter = require('prime/emitter');
var emitter = new Emitter()
var Map = require('prime/map')
var map = Map()

module.exports = prime({
	constructor: function(io, server, options) {
		// ensure dispatcher Type is set
		options.dispatcherType = options.dispatcherType ? options.dispatcherType : 'public';

		console.log('OPTIONS:', options, options.dispatcherType)

		this._options = options;

		// emitter.on('dispatch'+options.companyPrefix+'Options', this.serverPropagateMessage.bind(this, options.companyPrefix+'.setOption'));
		emitter.on('dispatch'+options.dispatcherType+'Options', this.serverPropagateMessage.bind(this));

		// this._ConferencePublic
		var namespace = '/'+options.dispatcherType;
		this.debug('configuring namespace:', namespace)
			io.configure(function() {
					// io.of(namespace)
	  			io.set('log level', 1);
					io.enable('browser client minification');  // send minified client
					io.enable('browser client etag');          // apply etag caching logic based on version number
					io.enable('browser client gzip');          // gzip the file	

				io.set('authorization', function(data, callback) {
				var s = require(__dirname+'/session.js');
				s.initialized = new s.Session();
				var ff = options.dispatcherType;
				console.log('iopipoipoipoiop', ff)
				s.initialized.authorize(ff, data, callback);
			});
		})
		.of(namespace)
		.on('connection', this.socketOnConnect.bind(this, server));

	},

// Socket.io related
	socketOnConnect: function(server, socket) {
		this._sockets[socket.id] = socket;
		var session = socket.handshake._session;
		this.debug('new client', session.id+' ('+session.interface+')')
		socket.emit('welcome', {'state': 'ok', 'session': session});
		this.socketAttachEvents(server, socket);
	},
	socketAttachEvents: function(socket) {},
	socketSetOptionsListener: function(server, socket, payload) {
		this.debug('listener setOption received', paylod.toString());
		var session = socket.handshake._session;
		var backend = require(__dirname+'/backend.js');
		var callback = function(data) {
			if (!data || !data.status || data.status != 'ok') throw Error('Invalid setSlideOption response');
			var message = {
				companyCallback: payload.companyCallback,
				response: data
			}
			// emitter.emit('message', message);
			this.serverPropagateToDispatchers(server, payload);
		}.bind(this);

		backend.asyncSendSlideOption(socket, payload, callback);
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
	serverPropagateToDispatchers: function(server, payload) {
		this.debug('trying to propagate payload to all dispatchers');
		if (!payload.dispatchers && type(payload.dispatchers) != 'array') {
			this.debug('payload has no dispatchers to emit to !!!');
			return this;
		}
		_(payload.dispatchers).each(function(dispatcher) {
			this.debug('emitting server event to ', dispatcher)
			emitter.emit('dispatch'+this._options.dispatcherType+'Options', payload);
		}, this);
		return this;
	},
	serverPropagateMessage: function(message) {
		this.debug('serverPropagateMessage', 're');
		// 	var message = {
		// 	'companyCallback': companyCallbackStr,
		// 	'response': payload
		// };
		if (type(this._sockets) == 'object' && _(this._sockets).count() > 0) {
				this.debug('dispatcher has at least one socket!');
				_(this._sockets).each(function(socket) {
					this.debug('dispatcher emitting to socket.id', socket.id+' '+socket.handshake._session.id+ ' ('+socket.handshake._session.interface+')');
					socket.emit('message', message);
				}, this);
			}
	},
	debug: function(str, opt) {
		console.log(' ---- ')
		console.log(str, opt ? opt : '');
	}
//

});

