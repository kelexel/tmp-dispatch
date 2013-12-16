var cluster = require('cluster')
	, express = require('express')
	, expressStore = new (require('connect-redis'))(express)
	, app = express()
	, fs = require('fs')
	, server = require('http').createServer(app)
	, logger = require(__dirname+'/logger.js')
	, io = require('socket.io').listen(server, {
		'logger': logger
	})
	, emitter = new (require('prime/emitter'))

require('prime');

global._ = require(__dirname+'/../etc/init_prime.js');
global._env = require(__dirname+'/../etc/env.js');
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
logger.info('Listening on port: '+_env.get('bindPort'));
server.listen(_env.get('bindPort'));

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
process.on('uncaughtException', function globalErrorCatch(error, p){
    console.error(error);
    console.error(error.stack);
});

var app = new (require(__dirname+'/app.js'))(io, server, emitter);
logger.log('Started!');
