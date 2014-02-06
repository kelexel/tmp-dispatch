var prime = require('prime');
var type = require('prime/type');
var object = require('prime/shell/object');
var querystring = require('querystring');

var Slide = prime({
	setOption: function(socket, payload, callback) {
		// if (!payload || !payload.optionArgs || !payload.optionArgs.slideId || !payload.optionName || !payload.optionArgs.value)
		// 	return callback({'status': 'error', 'log': 'invalid slide options'});
		if (!payload )
			return callback({'status': 'error', 'log': 'invalid payload #1'});
		else if (!payload.optionArgs)
			return callback({'status': 'error', 'log': 'invalid payload #2'});
		else if (!payload.optionArgs.slideId)
			return callback({'status': 'error', 'log': 'invalid payload #3'});
		else if (!payload.optionName)
			return callback({'status': 'error', 'log': 'invalid payload #4'});
		else if (!payload.optionArgs.value) {
			console.log(payload)
			return callback({'status': 'error', 'log': 'invalid payload #5'});
		}
		var session = this.helperGetSession(socket);
		if (!session.eventHash) throw Error('Invalid session!');
		if (!session.cookie) throw Error('Invalid session!');
		if (!session.token) throw Error('Invalid session!');
		// var url = '/h/'+session.eventHash+'/options/'+payload.optionArgs.slideId+'/?n='+payload.optionName+'&v='+payload.optionArgs.value;
		var url = '/h/'+session.eventHash+'/options/'+payload.optionArgs.slideId;
		var data = {'n': payload.optionName, 'v': payload.optionArgs.value};
		if (payload.optionArgs.extras) {
			data['e'] = JSON.stringify(payload.optionArgs.extras);
			// var e = [];
			// object.each(payload.optionArgs.extras, function(v, k) {
			// 	e.push({'n': k, 'v': v});
			// 	// data[k] = v;
			// })
			// data['e'] = e;
		}
		// console.log(data)
		var post_data = querystring.stringify(data);
		// console.log(post_data.length)
			// console.log(post_data)
		var options = {
			host: _env.get('backendHostname').toString(),
			port: _env.get('backendPort').toString(),
			path: url,
			rejectUnauthorized: false,
			method: 'POST',
			data: post_data,
			headers: {
				// 'Content-Type': 'application/json',
				'Cookie': session.cookie+'='+session.token,
				// 'HTTP_X_REQUEST': 'json',
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': post_data.length
			},
			debug: false
		};
		this.backendGetJson(options, function(statusCode, result){
			callback(false, result);
			// console.log(result)
		}, session);
	}
});

Slide.implement(require('./helper.js'));
Slide.implement(require('./backend.js'));
module.exports = Slide;