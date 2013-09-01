var prime = require('prime');
var type = require('prime/type');

module.exports = prime({
	_session: false,
	constructor: function() {
		this._session = {};
	},
	authorize: function(dispatcherType, data, callback) {
		if (dispatcherType == 'shell')
				return this.authorizeShellAccess(dispatcherType, data, callback);
			else
				return this.authorizeBackendAccess(dispatcherType, data, callback);
	},
	authorizeShellAccess: function(dispatcherType, data, callback) {
		logger.verbose('New shell connected!');
		callback(null, true);
	},
	authorizeBackendAccess: function(dispatcherType, data, callback) {
// 	// if no dispatcherType is passed, assume we're using the "public" dispatcherType
		// logger.verbose('New auth attempt on ', dispatcherType);
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
		logger.verbose('New auth against ', options.path);
		var backend = require(__dirname+'/backend.js');	
		var fn =  function(statusCode, result){	

			// if the backend returns something else than a statuscode 200	
			if (statusCode != 200) callback('Error invalid token', false);	
			// if the backend returns a status code 200 but says that the auth failed (result.auth != 'ok')	
			if (!result || result.auth != 'ok') callback('Error invalid token', false);	
			else {	
				// the backend found the matching session, and outputed infos that we will need later on, so we store them into the data object	
				result.session.interface = dispatcherType;
				this.populate(result.session);
				data._session = this._session;
				data.room = this._session.eventHash;
				if (type(data._session) != 'object') callback('Invalid session !', false);
				else callback(null, true);
			}	
		};	
		fn = fn.bind(this);
		backend.getJSON(options, fn);
	},
	populate: function(options) {
		if (!options.token)  new Error('Invalid token');
		if (!options.cookie)  new Error('Invalid cookie');
		if (!options.eventHash)  new Error('Invalid event eventHash');
		if (!options.eventCode)  new Error('Invalid event code');
		// if (!options.interface)  new Error('Invalid event interface');
		this._session.token = options.token;
		this._session.cookie = options.cookie;
		this._session.eventHash = options.eventHash;
		this._session.eventcode = options.eventCode;
		this._session.interface = options.interface;
		this._session.slide = options.slide;
	}
});
