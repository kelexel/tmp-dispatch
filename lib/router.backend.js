var prime = require('prime');
var http = require("http");
var https = require("https");


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

		var prot = options.port == 443 ? https : http;

		var req = prot.request(options, function(res) {
			var output = '';
			res.setEncoding('utf8');
			// console.log('headers', res.headers)

			res.on('data', function (chunk) {
				output += chunk;
			});

			res.on('end', function() {
				// attempt to JSONify the resulting string
				try {
					var obj = JSON.parse(output);
				} catch(e) {
					logger.error(options.path);
					logger.error(e);
					logger.debug(output);
					callback(500, obj, res);
				}
				if (callback) callback(res.statusCode, obj, res);
			});
		});
		req.on('error', function(err) {
			logger.error(err);
		});
		req.end();
	},
	backendSetPublicContent: function(socket, payload, callback) {
		if (!payload || !payload.commandArgs.content)
			return callback({'status': 'error', 'log': 'invalid public content'});
		var session = this.helperGetSession(socket);
		if (!session.eventHash) throw Error('Invalid session!');
		if (!session.cookie) throw Error('Invalid session!');
		if (!session.token) throw Error('Invalid session!');
		if (session.public)
			var url = '/'+session.eventCode;
		else
			var url = '/h/'+session.eventHash+'/public/embed/'+session.slide.id;

		var options = {
			host: _env.get('backendHostname').toString(),
			port: _env.get('backendPort').toString(),
		//	path: '/h/'+session.eventHash+'/manager/embed/'+payload.slideId+'/options/?n='+payload.optionName+'&v='+payload.optionValue,
			path: url,
			rejectUnauthorized: false,
			method: 'POST',
			data: payload.commandArgs.content,
			headers: {
				'Content-Type': 'application/json',
				'Cookie': session.cookie+'='+session.token,
				'HTTP_X_REQUEST': 'json'
			}
		};
		// console.log(options);
		this.backendGetJson(options, function(statusCode, result){
			callback(result);
		}, session);
	},
	backendSetSlideOption: function(socket, payload, callback) {
		if (!payload || !payload.optionArgs || !payload.optionArgs.slideId || !payload.optionName || !payload.optionArgs.value)
			return callback({'status': 'error', 'log': 'invalid slide options'});
		var session = this.helperGetSession(socket);
		if (!session.eventHash) throw Error('Invalid session!');
		if (!session.cookie) throw Error('Invalid session!');
		if (!session.token) throw Error('Invalid session!');
		var url = '/h/'+session.eventHash+'/options/'+payload.optionArgs.slideId+'/?n='+payload.optionName+'&v='+payload.optionArgs.value;

		var options = {
			host: _env.get('backendHostname').toString(),
			port: _env.get('backendPort').toString(),
		//	path: '/h/'+session.eventHash+'/manager/embed/'+payload.slideId+'/options/?n='+payload.optionName+'&v='+payload.optionValue,
			path: url,
			rejectUnauthorized: false,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Cookie': session.cookie+'='+session.token,
				'HTTP_X_REQUEST': 'json'
			}
		};
		this.backendGetJson(options, function(statusCode, result){
			callback(result);
		}, session);
	},
	backendFetchPublicSlideInfos: function(socket, callback) {
		var session = this.helperGetSession(socket);
		if (!session) throw Error('Invalid session!');
		if (!session.eventCode) throw Error('Invalid eventCode');
		if (!session.cookie) throw Error('Invalid cookie');
		if (!session.token) throw Error('Invalid token');
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
		this.backendGetJson(options, function(statusCode, result){
			callback(result);
		});
	},
	_cacheCookie: false,
	backendFetchManagerSlideContent: function(url, callback) {
		// var session = this.helperGetSession(socket);
		// if (!session) throw Error('Invalid session!');
		// if (!session.eventCode) throw Error('Invalid eventCode');
		// if (!session.cookie) throw Error('Invalid cookie');
		// if (!session.token) throw Error('Invalid token');
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
			// console.log('found cachecookie!')
			options.headers['Cookie'] = 'fa6bd32e8fd5dd8565f3eb82a64e8a3a='+this._cacheCookie;
		}
		this.backendGetJson(options, function(statusCode, result, res){
			var cookies = getCacheCookies(res);
			// console.log('cookies', cookies);
			if (!this._cacheCookie) this._cacheCookie = cookies['fa6bd32e8fd5dd8565f3eb82a64e8a3a'];
			callback(result);
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