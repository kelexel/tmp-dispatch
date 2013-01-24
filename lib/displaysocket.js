// this is the main socket used for the /display
// it used the same auth mechanism as /manager - since a user accessing /display should be logged in as a manager anyways.

exports.create = function (server, app, io) {
	var displaySocket = io
		// configure io auth
		.configure(function() {
				io.set('authorization', function(data, callback) {
						var obj = require(__dirname+'/socketsession.js');
						obj.authorizePublic(app, data, callback);
				});
		})
		// set the channel
		.of('/display')
		// emit a simple "welcome" message on connection 
		.on('connection', function (socket) {
			// here i'm storing the socket in the object.. is this a bad idea ? should i store the socket in an array instead ????????
			if (!_.isObject(displaySocket._sockets)) displaySocket._sockets = {};
			displaySocket._sockets[socket.id] = socket;
			var callback = function(data) {
				data = _.isObject(data) ? data : {};
				data.session = socket.handshake._session;
				data.state = 'ok';
				socket.emit('welcome', data);
			}
			var backend = require(__dirname+'/backend.js');
			backend.getCurrentSlide(app, socket, callback);
			console.log('DISPLAY OK')
	});

	// set the method used to tell every clients connected to /display to refresh their "slideOptions"
	displaySocket.sendRefreshOptions = function(payload) {
		var message = {
			'companyCallback': 'ConferenceDisplay.setOption',
			'response': payload
		};

		// if no one is connected, just do nothing, else, emit the message
		if (_.isObject(displaySocket._sockets) && _.size(displaySocket._sockets) > 0) 
			_.each(displaySocket._sockets, function(socket) {
				socket.emit('message', message);
			});
	}

	return displaySocket;
}