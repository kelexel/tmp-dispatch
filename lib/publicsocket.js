// this is the main socket used for the /display

exports.create = function (server, app, io) {
	var publicSocket = io
		.configure(function() {
				io.set('authorization', function(data, callback) {
						var obj = require(__dirname+'/socketsession.js');
						obj.authorizePublic(app, data, callback);
				});
		})
		.of('/public')
		.on('connection', function (socket) {
			if (!_.isObject(publicSocket._sockets)) publicSocket._sockets = {};
			publicSocket._sockets[socket.id] = socket;
			// we need to send the current slide to the /public connected client, so fetch it and emit it back to the client
			var callback = function(data) {
				data = _.isObject(data) ? data : {};
				data.state = 'ok';
				data.session = socket.handshake._session;
				socket.emit('welcome', data);
			}
			var backend = require(__dirname+'/backend.js');
			backend.getCurrentSlide(app, socket, callback);
	});

	// set the method used to tell every clients connected to /display to refresh their "slideOptions"
	publicSocket.sendRefreshOptions = function(payload) {
		var message = {
			'companyCallback': 'ConferencePublic.setOption',
			'response': payload
		};
		if (_.isObject(publicSocket._socket) && _.size(publicSocket._sockets) > 0) 
			publicSocket._sockets.each(function(socket) {
				socket.emit('message', message);
			});


	}


	return publicSocket;
}