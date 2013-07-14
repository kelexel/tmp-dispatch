var prime = require('prime');

if (process.env.NODE_ENV == 'dev') {
	 module.exports = _({
		'backendHostname': 'iconference',
		'backendPort': 80,
		'socketUrl': 'http://localhost:8999',
		'consoleDebugLevel': 'debug',
		'mongoIP': '172.16.76.130',
		'mongoPort': '27017',
		'mongoDB': 'bewiDB',
		'redisIP': '172.16.76.130',
		'redisPort': '6379'
	});
} else {
	 module.exports = _({
		'backendHostname': 'bewi.net',
		'backendPort': 80,
		'socketUrl': 'http://10.10.10.2:8999',
		'consoleDebugLevel': 'debug',
		'mongoIP': '10.10.10.2',
		'mongoPort': '27017',
		'mongoDB': 'bewiDB',
		'redisIP': '10.10.10.2',
		'redisPort': '6379'
	});
}