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
			publicSocket._socket = socket;
			var callback = function(data) {
				socket.emit('welcome', data);
			}
			var backend = require(__dirname+'/backend.js');
			backend.getCurrentSlide(app, socket, callback);
	});

	publicSocket.sendRefreshOptions = function(payload) {
		var message = {
			'companyCallback': 'ConferencePublic.setOption',
			'response': payload
		};
		if (publicSocket._socket) publicSocket._socket.emit('message', message);
	}

	return publicSocket;
}