// this is the main socket used for the /manager

exports.create = function (server, app, io) {
	var managerSocket = io
		.configure(function() {
				io.set('authorization', function(data, callback) {
						var obj = require(__dirname+'/socketsession.js');
						obj.authorizeManager(app, data, callback);
				});
		})
		.of('/manager')
		.on('connection', function (socket) {
			managerSocket._socket = socket;
			console.log('manager READY');
		//   var callback = function(data) {
		//     socket.emit('welcome', data);
		//   }
			var session = socket.handshake._session;
			socket.emit('welcome', session);

			socket.on('setSlideOption', function(payload){
				var session = socket.handshake._session;
				var backend = require(__dirname+'/backend.js');

				var callback = function(data) {
					var message = {
						companyCallback: payload.companyCallback,
						response: data
					}
					socket.emit('message', message);
					var _ = require('underscore');
					if (payload.interfaces && _.isArray(payload.interfaces)) {
						_.each(payload.interfaces, function(interface) {
							console.log('sending refresh to ', interface)
							server.emit(interface+'SendRefreshOptions', payload);
						})
					}
				}
				backend.setSlideOption(app, socket, payload, callback);
			});
		});
	

	return managerSocket;
}