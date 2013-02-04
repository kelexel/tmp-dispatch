var prime = require('prime');
var type = require('prime/type');
var Dispatcher = require('./dispatcher.js');

// exports.DispatchDisplay = prime({
module.exports = prime({
	inherits: Dispatcher,
	_sockets: {},
	_options: {},
	_dispatcherTyper: 'display',	
	constructor: function(io, server) {
		// Dispatcher.call(this, io, server,  {'dispatcherType': 'display'})
		Dispatcher.prototype.constructor.call(this, io, server);
			// this.constructor.parent.constructor.call(this,  io, server, {'dispatcherType': 'display'});
	// this.parent.constructor.call(this, io, server, {'dispatcherType': 'display'});													// "weird result"

	},
	socketAttachEvents: function(server, socket) {
		// socket.on(this._interfaceType+'setSlideOption', this.socketSlideOptionListener.bind(this, server, socket));
	}
});
	// sendRefreshOptions: function(payload) {
	// 	var message = {
	// 		'companyCallback': 'ConferenceDisplay.setOption',
	// 		'response': payload
	// 	};
		// // if no one is connected, just do nothing, else, emit the message
		// if (_.isObject(displaySocket._sockets) && _.size(displaySocket._sockets) > 0) 
		// 	_.each(displaySocket._sockets, function(socket) {
		// 		socket.emit('message', message);
		// 	});
	// }
// 	constructor: function(io, server) {
// 		io.configure(function() {
// 				io.set('authorization', function(data, callback) {
// 						var s = require(__dirname+'/session.js');
// 						s.initialized = new s.Session();
// 						s.initialized.authorize('manager', data, callback);
// 				});
// 		})
// 		.of('/display')
// 		.on('connection', this.onSocketConnect.bind(this, server));
// 		// .on('connection', function (socket) {
// 		// 	console.log('iopiopiopiopiopiopiop')
// 		// 	that._sockets[socket.id] = socket;
// 		// 	var callback = function(data) {
// 		// 		data = type(data) == 'object' ? data : {};
// 		// 		data.session = socket.handshake._session;
// 		// 		data.state = 'ok';
// 		// 		socket.emit('welcome', data);
// 		// 	}
// 		// 	var backend = require(__dirname+'/backend.js');
// 		// 	backend.getCurrentSlide(socket, callback);
// 		// 	console.log('DISPLAY OK')
// 		// })
// 	},
// 	onSocketConnect: function(server, socket) {
// 		this._sockets[socket.id] = socket;
// 		var session = socket.handshake._session;
// //		socket.emit('welcome', {'state': 'ok', 'session': session});

// 		var callback = function(data) {
// 				data = type(data) == 'object' ? data : {};
// 				data.session = session;
// 				data.state = 'ok';
// 				socket.emit('welcome', data);
// 			}
// 			var backend = require(__dirname+'/backend.js');
// 			backend.getCurrentSlide(socket, session, callback);
// 			console.log('DISPLAY OK')

// 	//		socket.on('setSlideOption', this.setSlideOption.bind(this, socket, server));
	
// 	}
// });




// // this is the main socket used for the /display
// // it used the same auth mechanism as /manager - since a user accessing /display should be logged in as a manager anyways.

// exports.create = function (server, app, io) {
// 	var displaySocket = io
// 		// configure io auth
// 		.configure(function() {
// 				io.set('authorization', function(data, callback) {
// 						var obj = require(__dirname+'/socketsession.js');
// 						obj.authorizeManager(app, data, callback);
// 				});
// 		})
// 		// set the channel
// 		.of('/display')
// 		// emit a simple "welcome" message on connection 
// 		.on('connection', function (socket) {
// 			// here i'm storing the socket in the object.. is this a bad idea ? should i store the socket in an array instead ????????
// 			if (!_.isObject(displaySocket._sockets)) displaySocket._sockets = {};
// 			displaySocket._sockets[socket.id] = socket;
// 			var callback = function(data) {
// 				data = _.isObject(data) ? data : {};
// 				data.session = socket.handshake._session;
// 				data.state = 'ok';
// 				socket.emit('welcome', data);
// 			}
// 			var backend = require(__dirname+'/backend.js');
// 			backend.getCurrentSlide(app, socket, callback);
// 			console.log('DISPLAY OK')
// 	});

// console.log('la');
	
// 	// require('dispatcher.js');

// 	// displaySocket.
// 	// set the method used to tell every clients connected to /display to refresh their "slideOptions"
// 	displaySocket.sendRefreshOptions = function(payload) {
// 		var message = {
// 			'companyCallback': 'ConferenceDisplay.setOption',
// 			'response': payload
// 		};
// 		// // if no one is connected, just do nothing, else, emit the message
// 		// if (_.isObject(displaySocket._sockets) && _.size(displaySocket._sockets) > 0) 
// 		// 	_.each(displaySocket._sockets, function(socket) {
// 		// 		socket.emit('message', message);
// 		// 	});
// 	}

// 	return displaySocket;
// }
