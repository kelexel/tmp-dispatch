var prime = require('prime');
var http = require("http");
var https = require("https");
var timeoutBackend = 120000;

var	getCacheCookies = function(req) {
	var cookies = {};
	if (req && req.headers && req.headers['set-cookie']) {
		var cookies = {};
		req.headers['set-cookie'].forEach(function(str) {
				str.split(';').forEach(function(cookie) {
					var parts = cookie.match(/(.*?)=(.*)$/)
					cookies[ parts[1].trim() ] = (parts[2] || '').trim();
				});
			});
	}
	return cookies;
};

module.exports = {
	backendGetJson: function(options, callback, cookie) {
		if(options.verbose) 
			logger.debug('CID: '+this._cid+' | backendGetJson '+options.path);
// console.log(options.path)
		if (options.debug) console.log(options);
		var prot = options.port == 443 ? https : http;

		var req = prot.request(options, function(res) {
			var output = '';
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				output += chunk;
			});

			res.on('end', function() {
				if (res.statusCode == 200 || res.statusCode == 300 || res.statusCode == 302) {
					try {
						if (options.debug) console.log(output);
						var obj = JSON.parse(output);
						if (callback) callback(res.statusCode, obj, res);
					} catch(e) {
						logger.error('#1 500: JSON.parse '+options.path);
						console.log(output);
						if (callback) callback(500, null, null);
					}
				} else {
					logger.error('#2 '+res.statusCode+' '+options.path+' '+(options.data ? options.data : ''));
					console.log(output);
					if (callback) callback(res.statusCode, null, null);
				}
			});
			req.on('error', function(err) {
				console.log('woops')
					logger.error('#3 error '+options.path);
					logger.error('backendGetJson ' + err);
					if (callback) callback(500, false, false);
			});
			req.on('socket', function (socket) {
				// console.log('using timeout', timeoutBackend)
					// socket.setTimeout(timeoutBackend);
					// socket.on('timeout', function() {
					// 	console.log('timeout')
					// 	console.log('timeout')
					// 	console.log('timeout')
					// 	req.abort();
				// });
			});
		});
		// if (options.method == "post") 
		// console.log(options);
			// if (options.debug) console.log(options);
		if (options.method == "POST") req.write(options.data);
		req.end();
	},
	_cacheCookie: false,
	backendFetchManagerSlideContent: function(url, parentCallback) {
		var options = {
				host: _env.get('backendHostname').toString(),
				port: _env.get('backendPort').toString(),
				path: url,
				rejectUnauthorized: false,
				method: 'GET',
				headers: {
						'Content-Type': 'application/json',
						// 'Cookie': session.cookie+'='+session.token,
						'HTTP_X_REQUEST': 'json'
				}
		};
		if (this._cacheCookie) {
			options.headers['Cookie'] = _env.get('cookieName')+'='+this._cacheCookie;
		}
		this.backendGetJson(options, function(statusCode, result, res){
			if (statusCode == 200) {
				var cookies = getCacheCookies(res);
				if (!this._cacheCookie) this._cacheCookie = cookies[_env.get('cookieName')];
			}
			parentCallback(null, statusCode, result);
		}.bind(this));
	},
	_backendGetHeaders: function(session) {
		return {
			'Content-Type': 'application/json',
			'Cookie': session.cookie+'='+session.token,
			'HTTP_X_REQUEST': 'json'
		};
	}
};