var prime = require('prime');
var type = require('prime/type');

var Slide = prime({
	setOption: function(socket, payload, callback) {
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
			callback(false, result);
		}, session);
	}
});

Slide.implement(require('./helper.js'));
Slide.implement(require('./backend.js'));
module.exports = Slide;