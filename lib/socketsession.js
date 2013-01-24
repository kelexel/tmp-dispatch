
exports.createSocketSession = function (options) {
	var session = {
		'id': options.phpSessId,
		'name': options.phpSessName,
		'eventHash': options.eventHash,
		'eventCode': options.eventCode
	}
	return session;
}

exports.authorizePublic = function(app, data, callback, authType) {
	var authThype = !authType ? 'public' : authType;
	// how do i get app here ? 

  // if (data.headers.cookie) {
        //     var cookie = parseCookie(data.headers.cookie);
        //     sessionStore.get(cookie['connect.sid'], function(err, session) {
        //         if (err || !session) {
        //             callback('Error', false);
        //         } else {
        //             data.session = session;
        //             callback(null, true);
        //         }
        //     });
        // } else {
        //     callback('No cookie', false);
        // }

	var that = this;
  var backend = require(__dirname+'/backend.js');


	var options = {
		host: app.get('backendHostname'),
		port: app.get('backendPort'),
		path: '/a/auth/'+authType+'/'+data.query.phpSessId,
		method: 'GET',
		headers: {
				'Content-Type': 'application/json'
		}
	};
	backend.getJSON(options, function(statusCode, result){
		if (statusCode != 200) callback('Error invalid phpSessId', false);
		if (!result || result.auth != 'ok') callback('Error invalid phpSessId', false);
		else {
			data._session = that.createSocketSession(result.session);
//			console.log('data._session is set here', data._session)
			callback(null, true);
		}
	});
}

exports.authorizeManager = function(app, data, callback, authType) {
	return this.authorizePublic(app, data, callback, 'manager');
}
