var prime = require('prime');
var type = require('prime/type');

exports.Session = new prime ({
	_session: {},
	// constructor: function() {

	// },

	authorize: function(dispatcherType, data, callback) {
// 	// if no dispatcherType is passed, assume we're using the "public" dispatcherType
	console.log('new uath on ', dispatcherType)
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
				console.log('iopipoiopio', type(data._session) )
				data._session = this._session;
				if (type(data._session) != 'object') callback('Invalid session !', false);
				else callback(null, true);
			}	
		};	
		fn = fn.bind(this);
		console.log(options.host.toString())
		backend.getJSON(options, fn);
	},
	populate: function(options) {
		if (!options.id)  new Error('Invalid cookie id');
		if (!options.name)  new Error('Invalid cookie name');
		if (!options.eventHash)  new Error('Invalid event eventHash');
		if (!options.eventCode)  new Error('Invalid event code');
		if (!options.interface)  new Error('Invalid event interface');
		this._session.id = options.phpSessId;
		this._session.name = options.phpSessName;
		this._session.eventHash = options.eventHash;
		this._session.eventcode = options.eventCode;
		this._session.interface = options.interface;
	}


});

// // this is the base "session" object it contains infos given by the backend that needs to be passed to each request made by node to the backend, 
// // so that node can impersonate the current user when querying the backend
// exports.createSocketSession = function (options) {
// 	var session = {
// 		'id': options.phpSessId,
// 		'name': options.phpSessName,
// 		'eventHash': options.eventHash,
// 		'eventCode': options.eventCode,
// 		'interface': options.interface
// 	}
// 	if (!session.id)  new Error('Invalid cookie id');
// 	if (!session.name)  new Error('Invalid cookie name');
// 	if (!session.eventHash)  new Error('Invalid event eventHash');
// 	if (!session.eventCode)  new Error('Invalid event code');
// 	if (!session.interface)  new Error('Invalid event interface');
// 	return session;
// }


// // this is the method used for all socket.io authoriztion
// // it takes a given dispatcherType to figure against which backend URL to challenge.
// // note that the infos used for the challenge are acced via data.query.* 
// exports.authorizePublic = function(app, data, callback, dispatcherType) {
// 	// if no dispatcherType is passed, assume we're using the "public" dispatcherType
// 	var authThype = !dispatcherType ? 'public' : dispatcherType;


// 	// if i ever wanted to enforce express cookies, i would use this..
// 	// if (data.headers.cookie) {
// 	//     var cookie = parseCookie(data.headers.cookie);
// 	//     sessionStore.get(cookie['connect.sid'], function(err, session) {
// 	//         if (err || !session) {
// 	//             callback('Error', false);
// 	//         } else {
// 	//             data.session = session;
// 	//             callback(null, true);
// 	//         }
// 	//     });
// 	// } else {
// 	//     callback('No cookie', false);
// 	// }

// 	var options = {
// 		host: app.get('backendHostname'),
// 		port: app.get('backendPort'),
// 		path: '/a/auth/'+dispatcherType+'/'+data.query.phpSessId,
// 		method: 'GET',
// 		headers: {
// 				'Content-Type': 'application/json'
// 		}
// 	};

// 	var backend = require(__dirname+'/backend.js');
// 	var fn =  function(statusCode, result){
// 		// if the backend returns something else than a statuscode 200
// 		if (statusCode != 200) callback('Error invalid phpSessId', false);
// 		// if the backend returns a status code 200 but says that the auth failed (result.auth != 'ok')
// 		if (!result || result.auth != 'ok') callback('Error invalid phpSessId', false);
// 		else {
// 			// the backend found the matching session, and outputed infos that we will need later on, so we store them into the data object
// 			result.session.interface = dispatcherType;
// 			data._session = this.createSocketSession(result.session);
// 			if (!_.isObject(data._session)) callback('Invalid session !', false);
// 			else callback(null, true);
// 		}
// 	};
// 	fn = _.bind(fn, this);
// 	backend.getJSON(options,fn);
// }

// // this one is the same as the above, but using an dispatcherType="manager", so just invoke the above ;)
// exports.authorizeManager = function(app, data, callback, dispatcherType) {
// 	return this.authorizePublic(app, data, callback, 'manager');
// }
