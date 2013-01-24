// this is the base "session" object it contains infos given by the backend that needs to be passed to each request made by node to the backend, 
// so that node can impersonate the current user when querying the backend
exports.createSocketSession = function (options) {
	var session = {
		'id': options.phpSessId,
		'name': options.phpSessName,
		'eventHash': options.eventHash,
		'eventCode': options.eventCode
	}
	return session;
}


// this is the method used for all socket.io authoriztion
// it takes a given authType to figure against which backend URL to challenge.
// note that the infos used for the challenge are acced via data.query.* 
exports.authorizePublic = function(app, data, callback, authType) {
	// if no authType is passed, assume we're using the "public" authType
	var authThype = !authType ? 'public' : authType;

	// if i ever wanted to enforce express cookies, i would use this..
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

	var options = {
		host: app.get('backendHostname'),
		port: app.get('backendPort'),
		path: '/a/auth/'+authType+'/'+data.query.phpSessId,
		method: 'GET',
		headers: {
				'Content-Type': 'application/json'
		}
	};
	// need to do "that"... how the hell can i override bindings in nodejs ?!
	var that = this;

	var backend = require(__dirname+'/backend.js');
	backend.getJSON(options, function(statusCode, result){
		// if the backend returns something else than a statuscode 200
		if (statusCode != 200) callback('Error invalid phpSessId', false);
		// if the backend returns a status code 200 but says that the auth failed (result.auth != 'ok')
		if (!result || result.auth != 'ok') callback('Error invalid phpSessId', false);
		else {
			// the backend found the matching session, and outputed infos that we will need later on, so we store them into the data object
			data._session = that.createSocketSession(result.session);
			// and we tell the callback that auth was a success
			callback(null, true);
		}
	});
}

// this one is the same as the above, but using an authType="manager", so just invoke the above ;)
exports.authorizeManager = function(app, data, callback, authType) {
	return this.authorizePublic(app, data, callback, 'manager');
}
