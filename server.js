// Use with something like:
//      env NODE_ENV='dev' node server.js
//      env NODE_ENV='prod' node server.js

var express = require('express')
        , RedisStore = require('connect-redis')(express)
        , sessionStore = new RedisStore()
        , app = express()
        , fs = require('fs')
        , server = require('http').createServer(app)
        , logger = require(__dirname+'/etc/init_logger.js')
        , io = require('socket.io').listen(server,{
                logger : logger
        });

var cluster = require('cluster');

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
                 store: sessionStore
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

logger.log('Starting Manager Dispatcher');
var dm = new (require(__dirname+'/lib/dispatcher/dispatcher_manager.js'))(io, server);
logger.log('Starting Manager Dispatcher');
var dd = new (require(__dirname+'/lib/dispatcher/dispatcher_display.js'))(io, server);
logger.log('Starting Manager Dispatcher');
var dp = new (require(__dirname+'/lib/dispatcher/dispatcher_public.js'))(io, server);
logger.log('Starting Manager Shell prompt');
var dp = new (require(__dirname+'/lib/dispatcher/dispatcher_shell.js'))(io, server);

