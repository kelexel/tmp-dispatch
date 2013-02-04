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

		console.log('OPTIONS:', _dispatcherTyper)


		emitter.on('dispatch'+_dispatcherTyper+'Options', this.serverPropagateMessage.bind(this));

		// this._ConferencePublic
		var namespace = '/'+_dispatcherTyper;
		this.debug('configuring namespace:', namespace)
		io.configure(function() {
					io.enable('browser client minification');  // send minified client
					io.enable('browser client etag');          // apply etag caching logic based on version number
					io.enable('browser client gzip');          // gzip the file	
					io.set('log level', 1);
			});
			io.of(namespace)
			.authorization(function(data, callback) {
				var s = require(__dirname+'/session.js');
				s.initialized = new s.Session();
				s.initialized.authorize(_dispatcherTyper, data, callback);
			})
		
		.on('connection', this.socketOnConnect.bind(this, server));

	},

// Socket.io related
	socketOnConnect: function(server, socket) {
		this._sockets[socket.id] = socket;
		socket.handshake._session.endpoint = socket.flags.endpoint;
		var session = socket.handshake._session;
		this.debug('new client', session.id+' ('+session.interface+' / '+session.endpoint+')')
		socket.emit('welcome', {'state': 'ok', 'session': session});
		this.socketAttachEvents(server, socket);
	},
	socketAttachEvents: function(socket) {},
	socketSetOptionsListener: function(server, socket, payload) {
		this.debug('listener setOption received', payload.toString());
		var session = socket.handshake._session;
		var backend = require(__dirname+'/backend.js');
		var callback = function(data) {
			if (!data || !data.status || data.status != 'ok') throw Error('Invalid setSlideOption response');
			var message = payload;
			message.response = data;
			// emitter.emit('message', message);
			this.serverPropagateToDispatchers(server, message);
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
			this.debug('propagating payload to ', 'dispatch'+dispatcher+'Options')
			emitter.emit('dispatch'+dispatcher+'Options', payload);
		}, this);
		return this;
	},
	serverPropagateMessage: function(message) {
		this.debug(this._dispatcherTyper+' serverPropagateMessage', message);
		// 	var message = {
		// 	'companyCallback': companyCallbackStr,
		// 	'response': payload
		// };
		var cnt = _(this._sockets).count();
		if (type(this._sockets) == 'object' && cnt > 0) {
				this.debug('dispatcher has '+cnt+' socket(s)');
				_(this._sockets).each(function(socket, k) {
					try {
						var t = type(socket.handshake._session);
						// console.log(socket.handshake, socket.handshake._session);
						this.debug('- emitting to socket.id', socket.id+' '+socket.handshake._session.id+ ' ('+socket.handshake._session.interface+' / '+socket.flags.endpoint+')');
						this.debug(message)
						socket.emit('message', message);
					} catch (e) {
						this.debug('- found one dead socket, cleaning up');
						delete this._sockets[k];
					}
				}, this);
			}
			else this.debug('dispatcher has no sockets');
	},
	debug: function(str, opt) {
		console.log(str, opt ? opt : '');
	}
//

});

