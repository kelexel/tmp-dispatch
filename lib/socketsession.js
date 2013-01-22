// thought that was one way to go ?
var express = require('express'), app = express(), io = require('socket.io'), backend = require(__dirname+'/backend.js');

exports.createSocketSession = function (options) {
	var session = {
		'phpSessId': options.phpSessId,
		'eventHash': options.eventHash
	}
	return session;
}

exports.authorize = function(data, callback) {
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
	backend.getJSON(options, function(statusCode, result){
		if (statusCode != 200) callback('Error invalid phpSessId', false);
		if (result.auth != 'ok') callback('Error invalid phpSessId', false);
		else {
			data._session = that.createSocketSession(result.session);
			callback(null, true);
		}
	});
}