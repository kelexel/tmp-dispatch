
exports.createSocketSession = function (options) {
	var session = {
		'phpSessId': options.phpSessId,
		'eventHash': options.eventHash
	}
	return session;
}

exports.authorize = function(app, data, callback) {
	// how do i get app here ? 

	var options = {
		host: app.get('backendHostname'),
		port: app.get('backendPort'),
		path: '/a/auth/check/'+data.query.phpSessId,
		method: 'GET',
		headers: {
				'Content-Type': 'application/json'
		}
	};
	var that = this;
  var backend = require(__dirname+'/backend.js');
	backend.getJSON(options, function(statusCode, result){
		if (statusCode != 200) callback('Error invalid phpSessId', false);
		if (result.auth != 'ok') callback('Error invalid phpSessId', false);
		else {
			data._session = that.createSocketSession(result.session);
			console.log('data._session is set here', data._session)
			callback(null, true);
		}
	});
}