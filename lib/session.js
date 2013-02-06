var prime = require('prime');
var type = require('prime/type');

exports.Session = new prime ({
	_session: {},
	authorize: function(dispatcherType, data, callback) {
// 	// if no dispatcherType is passed, assume we're using the "public" dispatcherType
		console.log('--')
		console.log('new auth on ', dispatcherType);
		var authThype = !dispatcherType ? 'public' : dispatcherType;
		var options = {
			host: _env.get('backendHostname').toString(),
			port: _env.get('backendPort').toString(),
			path: '/a/auth/'+dispatcherType+'/'+data.query.phpSessId,
			method: 'GET',
			headers: {
					'Content-Type': 'application/json'
			}
		};
		var backend = require(__dirname+'/backend.js');	
		var fn =  function(statusCode, result){	

			// if the backend returns something else than a statuscode 200	
			if (statusCode != 200) callback('Error invalid phpSessId', false);	
			// if the backend returns a status code 200 but says that the auth failed (result.auth != 'ok')	
			if (!result || result.auth != 'ok') callback('Error invalid phpSessId', false);	
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
		if (!options.id)  new Error('Invalid cookie id');
		if (!options.name)  new Error('Invalid cookie name');
		if (!options.eventHash)  new Error('Invalid event eventHash');
		if (!options.eventCode)  new Error('Invalid event code');
		// if (!options.interface)  new Error('Invalid event interface');
		this._session.id = options.phpSessId;
		this._session.name = options.phpSessName;
		this._session.eventHash = options.eventHash;
		this._session.eventcode = options.eventCode;
		this._session.interface = options.interface;
	}
});
