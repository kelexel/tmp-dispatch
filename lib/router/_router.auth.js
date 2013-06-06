var prime = require('prime');
var type = require('prime/type');

module.exports = {
	challenge: function(dispatcherType, data, callback) {
		console.log('challenging')
		console.log('challenging')
		console.log('challenging')
		console.log('challenging')
		console.log('challenging')
		if (dispatcherType == 'shell')
				return this.authorizeShell(dispatcherType, data, callback);
			else
				return this.authorizeClient(dispatcherType, data, callback);
	},
	authorizeShell: function(dispatcherType, data, callback) {
		logger.verbose('CID: '+this._cid+' New shell connected!');
		callback(null, true);
	},
	authorizeClient: function(dispatcherType, data, callback) {
// 	// if no dispatcherType is passed, assume we're using the "public" dispatcherType
		logger.verbose('CID: '+this._cid+' New auth attempt on ', dispatcherType);
		var authThype = !dispatcherType ? 'public' : dispatcherType;
		var options = {
			host: _env.get('backendHostname').toString(),
			port: _env.get('backendPort').toString(),
			path: '/a/auth/'+dispatcherType+'/'+data.query.token+'?public='+(data.query.public == 'true' ? 'true' : 'false'),
			method: 'GET',
			headers: {
					'Content-Type': 'application/json'
			}
		};
		logger.verbose('CID: '+this._cid+' New auth against ', options.path);
		var backend = require(__dirname+'/backend.js');	
		var fn =  function(statusCode, result){	

			// if the backend returns something else than a statuscode 200	
			if (statusCode != 200) callback('Error invalid token', false);	
			// if the backend returns a status code 200 but says that the auth failed (result.auth != 'ok')	
			if (!result || result.auth != 'ok') callback('Error invalid token', false);	
			else {	
				// the backend found the matching session, and outputed infos that we will need later on, so we store them into the data object	
				result.session.interface = dispatcherType;
				var session = this.populate(result.session);
				// data._session = session;
				// data.room = session.eventHash;
				if (type(session) != 'object') callback('Invalid session !', false);
				var client = new (require(__dirname+'/../client/client.js'))(session)
				data._Client = client;
				callback(null, true);
			}	
		}.bind(this);
		backend.getJSON(options, fn);
	},
	populate: function(options) {
		if (!options.token)  new Error('Invalid token');
		if (!options.cookie)  new Error('Invalid cookie');
		if (!options.eventHash)  new Error('Invalid event eventHash');
		if (!options.eventCode)  new Error('Invalid event code');
		// if (!options.interface)  new Error('Invalid event interface');
		var session = {};
		session.token = options.token;
		session.cookie = options.cookie;
		session.eventHash = options.eventHash;
		session.eventcode = options.eventCode;
		session.interface = options.interface;
		session.slide = options.slide;
	}
};