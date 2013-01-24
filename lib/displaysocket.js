exports.create = function (server, app, io) {
	var displaySocket = io
		.configure(function() {
				io.set('authorization', function(data, callback) {
						var obj = require(__dirname+'/socketsession.js');
						obj.authorizePublic(app, data, callback);
				});
		})
		.of('/display')
		.on('connection', function (socket) {
			displaySocket._socket = socket;
			var callback = function(data) {
				socket.emit('welcome', data);
			}
	});

	displaySocket.sendRefreshOptions = function(payload) {
		var message = {
			'companyCallback': 'ConferenceDisplay.setOption',
			'response': payload
		};

		if (displaySocket._socket) displaySocket._socket.emit('message', message);
	}

	return displaySocket;
}