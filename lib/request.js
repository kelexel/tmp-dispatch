// i think i should not do the following ? or should i to get access to these in the exports.myFn bellow ?
var http = require("http")
		, https = require("https")
		, express = require('express')
		, app = express()
		, prime = require('prime');

exports.getJSON = function(options, callback, cookie) {
		if(options.verbose) logger.debug("Backend request to", options.path);

		var prot = options.port == 443 ? https : http;

		var req = prot.request(options, function(res)
		{
				var output = '';
				res.setEncoding('utf8');

				res.on('data', function (chunk) {
						output += chunk;
				});

				res.on('end', function() {
					// attempt to JSONify the resulting string
						try{
								var obj = JSON.parse(output);
						} catch(e) {
							logger.error(options.path);
							logger.error(output);
							callback(500, obj);
						}
						if (callback) callback(res.statusCode, obj);
				});
		});
		req.on('error', function(err) {
			logger.error(err);
		});

		req.end();
};

exports.getCurrentSlide = function(socket, session, callback) {
	if (session.eventCode == 'undefined' || !session.eventCode) throw Error('Invalid eventCode');
	if (session.token == 'undefined' || !session.token) throw Error('Invalid token');
	if (session.cookie == 'undefined' || !session.eventCode) throw Error('Invalid name');
	if (session.token == 'undefined' || !session.token) throw Error('Invalid id');
	var options = {
			host: _env.get('backendHostname').toString(),
			port: _env.get('backendPort').toString(),
			path: '/'+session.eventCode+'/get/state',
			method: 'GET',
			headers: {
					'Content-Type': 'application/json',
					'Cookie': session.cookie+'='+session.token,
					'HTTP_X_REQUEST': 'json'
			}
	};
	this.getJSON(options, function(statusCode, result){
		callback(result);
	});
}

// used to set an option on any dispatchers, by a manager (backend ensures the passed in phpSessionId matches a "manager role" user)
exports.asyncSendSlideOption = function(socket, payload, callback) {
	if (!payload || !payload.optionArgs || !payload.optionArgs.slideId || !payload.optionName || !payload.optionArgs.value)
		return callback({'status': 'error', 'log': 'invalid slide options'});

	var session = socket.handshake._session;
	var url = '/h/'+session.eventHash+'/options/'+payload.optionArgs.slideId+'/?n='+payload.optionName+'&v='+payload.optionArgs.value;
	var options = {
			host: _env.get('backendHostname').toString(),
			port: _env.get('backendPort').toString(),
			path: url,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': session.cookie+'='+session.token,
				'HTTP_X_REQUEST': 'json'
		}
	};
	this.getJSON(options, function(statusCode, result){
		callback(result);
	}, session);
}

