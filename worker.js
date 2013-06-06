// Use with something like:
//      env NODE_ENV='dev' node server.js
//      env NODE_ENV='prod' node server.js
var cluster = require('cluster')
	, express = require('express')
	// , redis = require('redis')
	, expressStore = new (require('connect-redis'))(express)
	, app = express()
	, fs = require('fs')
	, server = require('http').createServer(app)
	, logger = require(__dirname+'/lib/logger.js')
	, io = require('socket.io').listen(server, {
		'logger': logger
	})
	, emitter = new (require('prime/emitter'))
	// , cacheRedis = require('node-redis');

// cacheClient = cacheRedis.createClient('6379', '172.16.76.134', null);
// cacheClient.select(2, function() {console.log('redis selected db 2') });
// cacheClient.on('error', function(err){console.error(err);});
// var cacheClient = null;



// var emitter = new Emitter()

require('prime');
global._ = require(__dirname+'/etc/init_prime.js');
global._env = require(__dirname+'/etc/env.js');
global.logger = logger;

// CORS settings, passing * for now
app.all('*', function(req, res, next){
		if (!req.get('Origin')) return next();
		// use "*" here to accept any origin
		res.set('Access-Control-Allow-Origin', '*');
		res.set('Access-Control-Allow-Methods', 'GET, POST');
		res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
		// res.set('Access-Control-Allow-Max-Age', 3600);
		if ('OPTIONS' == req.method) return res.send(200);
		next();
});

// just listen.
server.listen(8999);

// express setup
app.configure(function() {
		// set an express cookie + session, not really used for now
		app.use(express.cookieParser());
		app.use(express.session({
				secret: 'helloworld',
				 // store: expressStore
		}));
		app.use(express.bodyParser());
		app.use(app.router);
		// serve up static file if found
		app.use('/', express.static(__dirname + '/public'));
		// everything else gets index.html
		app.use('/', function (req, res, next) {
				fs.readFile(__dirname + '/public/index.html', 'utf8', function (err, data) {
						res.end(data);
				});
		});
});

logger.log('Starting..');
var dm = new (require(__dirname+'/lib/router/router.js'))(io, server, emitter);
logger.log('Started!');
// var dm = new (require(__dirname+'/lib/router/router.js'))('shell', io, server, emitter);
// logger.log('Starting Display Dispatcher');
// var dd = new (require(__dirname+'/lib/dispatcher/dispatcher_display.js'))(io, server);
// logger.log('Starting Public Dispatcher');
// var dp = new (require(__dirname+'/lib/dispatcher/dispatcher_public.js'))(io, server);
// logger.log('Starting Shell prompt');
// var dp = new (require(__dirname+'/lib/dispatcher/dispatcher_shell.js'))(io, server);

