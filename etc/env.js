var prime = require('prime');

if (!process.env.NODE_ENV || process.env.NODE_ENV == 'dev') {
	console.log('dev')
	 module.exports = _({
		'backendHostname': 'iconference',
		'backendPort': 80,
		'cookieName': 'fa6bd32e8fd5dd8565f3eb82a64e8a3a',
		'shellUrl': 'http://localhost:8999',
		// 'shellUrl': 'http://bewi.net:443',
		'consoleDebugLevel': 'debug',
		'mongoIP': '172.16.76.130',
		'mongoPort': '27017',
		'mongoDB': 'bewiDB',
		'redisIP': '172.16.76.130',
		'redisPort': '6379',
		'pullDelay': 2500
	});
} else if (process.env.NODE_ENV == 'remote') {
	 module.exports = _({
		'shellUrl': 'http://bewi.net:443'
	});
} else {
	 module.exports = _({
		'backendHostname': 'bewi.net',
		'backendPort': 80,
		'cookieName': 'fa6bd32e8fd5dd8565f3eb82a64e8a3a',
		'shellUrl': 'http://10.10.10.2:8999',
		'consoleDebugLevel': 'debug',
		'mongoIP': '10.10.10.2',
		'mongoPort': '27017',
		'mongoDB': 'bewiDB',
		'redisIP': '10.10.10.2',
		'redisPort': '6379',
		'pullDelay': 1500
	});
}