// i think i should not do the following ? or should i to get access to these in the exports.myFn bellow ?
var http = require("http")
		, https = require("https")
		, express = require('express')
		, app = express()
		, prime = require('prime');

// there is probably a better middleware to do this, but at least i can configure it myself
// note, cookie is very important as it will contain the phpSessionId that the http object will use when querying the backend
exports.getJSON = function(options, callback, cookie)
{
		console.log("rest::getJSON.path:", options.path);

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
								// but if it fails, for now, just spit out the output to console .. (there should be a better way of doing this!)
								console.log(e)
								// console.log('output was : ', output);
								callback(500, obj);
						}
						if (callback) callback(res.statusCode, obj);
				});
		});
		// not used for now, but again, it should be.
		req.on('error', function(err) {
				//res.send('error: ' + err.message);
		});

		req.end();
};

exports.getCurrentSlide = function(socket, session, callback)
{
		// var session = socket.handshake._session;
			if (session.eventCode == 'undefined' || !session.eventCode) throw Error('Invalid eventCode');
			if (session.phpSessId == 'undefined' || !session.phpSessId) throw Error('Invalid phpSessId');
			if (session.name == 'undefined' || !session.eventCode) throw Error('Invalid name');
			if (session.id == 'undefined' || !session.id) throw Error('Invalid id');
			var options = {
					host: _env.get('backendHostname').toString(),
					port: _env.get('backendPort').toString(),
					path: '/'+session.eventCode+'/get/state'+'?sessId='+session.phpSessId,
					method: 'GET',
					headers: {
							'Content-Type': 'application/json',
							'Cookie': session.name+'='+session.id,
							'HTTP_X_REQUEST': 'json'
					}
			};
			this.getJSON(options, function(statusCode, result){
				callback(result);
			});
}

// used to set an option on any dispatchers, by a manager (backend ensures the passed in phpSessionId matches a "manager role" user)
exports.asyncSendSlideOption = function(socket, payload, callback)
{
		if (!payload || !payload.optionArgs || !payload.optionArgs.slideId || !payload.optionName || !payload.optionArgs.value)
				return callback({'status': 'error', 'log': 'invalid slide options'});

			var session = socket.handshake._session;
			var url = '/h/'+session.eventHash+'/options/'+payload.optionArgs.slideId+'/?n='+payload.optionName+'&v='+payload.optionArgs.value;
			var options = {
					host: _env.get('backendHostname').toString(),
					port: _env.get('backendPort').toString(),
				//	path: '/h/'+session.eventHash+'/manager/embed/'+payload.slideId+'/options/?n='+payload.optionName+'&v='+payload.optionValue,
					path: url,
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Cookie': session.name+'='+session.id,
						'HTTP_X_REQUEST': 'json'
				}
			};
			this.getJSON(options, function(statusCode, result){
				callback(result);
			}, session);
}

