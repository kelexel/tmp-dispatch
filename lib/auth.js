var prime = require('prime');
var type = require('prime/type');

module.exports = prime({
	_session: false,
	_cid: false,
	_endpoint: false,
	constructor: function(cid) {
		this._cid = cid;
	},
	challenge: function(endpoint, data, callback) {
		this._endpoint = endpoint;
		if (this._endpoint == 'shell')
				return this.authorizeShell(endpoint, data, callback);
			else
				return this.authorizeClient(endpoint, data, callback);
	},
	authorizeShell: function(endpoint, data, callback) {
		logger.verbose('CID: '+this._cid+' | New shell connected!');

		/// ATTENTION CHECK IS SHELL OU /SHELL !!! ????
		data._Client = {'_session': {'endpoint': '/shell'}};
		callback(null, true);
	},
	authorizeClient: function(endpoint, data, callback) {
// 	// if no dispatcherType is passed, assume we're using the "public" dispatcherType
		logger.verbose('CID: '+this._cid+' | New auth attempt on '+ this._endpoint);
		var authThype = !this._endpoint ? 'public' : this._endpoint;
		var options = {
			rejectUnauthorized: false,
			host: _env.get('backendHostname').toString(),
			port: _env.get('backendPort').toString(),
			path: '/a/auth/'+this._endpoint+'/'+data.query.token+'?public='+(data.query.public == 'true' ? 'true' : 'false')+'&eid='+(data.query.eid ? data.query.eid : 'false'),
			method: 'GET',
			headers: {
					'Content-Type': 'application/json'
			}
		};
		logger.verbose('CID: '+this._cid+' | New auth against '+ options.path);
		var backend = require(__dirname+'/backend.js');	
		var authCallback =  function(statusCode, result){	

			// if the backend returns something else than a statuscode 200	
			if (statusCode != 200) callback('Error invalid token', false);	
			// if the backend returns a status code 200 but says that the auth failed (result.auth != 'ok')	
			if (!result || result.auth != 'ok') {
				// socket.emit('command', {'command': 'notice', 'commandArgs': {'log' : 'invalid session'}});
				callback('Error invalid token', false);
			}
			else {	
				// the backend found the matching session, and outputed infos that we will need later on, so we store them into the data object	
				result.session.endpoint = endpoint;
				result.session.public = data.query.public;
				var session = this.populate(result.session);
				// data._session = session;
				// data.room = session.eventHash;
				if (type(session) != 'object') callback('Invalid session !', false);
				data._Client = new (require(__dirname+'/client.js'))(session)
				callback(null, true);
			}	
		}.bind(this);
		backend.getJSON(options, authCallback);
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
		session.eventCode = options.eventCode;
		// session.interface = options.interface;
		session.endpoint = options.endpoint;
		session.slide = options.slide;
		return session;
	}
});