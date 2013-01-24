var express = require('express')
  // not really used
  , RedisStore = require('connect-redis')(express)
  // not really used
  , sessionStore = new RedisStore()
  , app = express()
  , fs = require('fs')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  // not really used
  , api = require(__dirname+'/lib/api.js');


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
  // set the url and port of our nodejs app
  app.set('backendHostname', 'iconference');
  app.set('backendPort', 80);

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
  // serve up api routes next - disabled for now
  // api.create(app);
  // everything else gets index.html
  app.use('/', function (req, res, next) {
    fs.readFile(__dirname + '/public/index.html', 'utf8', function (err, data) {
      res.end(data);
    });
  });
});

// instantiate the publicSocketModel - will handle all /public calls
var PublicSocketModel = require(__dirname+'/lib/publicsocket.js');
var PublicSocket  = PublicSocketModel.create(server, app, io);
server.addListener('publicSendRefreshOptions', PublicSocket.sendRefreshOptions);

// instantiate the displaySocketModel - will handle all /display calls
var DisplaySocketModel = require(__dirname+'/lib/displaysocket.js');
var DisplaySocket  = DisplaySocketModel.create(server, app, io);
server.addListener('displaySendRefreshOptions', DisplaySocket.sendRefreshOptions);

// instantiate the managerSocketModel - will handle all /manager calls
var ManagerSocketModel = require(__dirname+'/lib/managersocket.js');
var ManagerSocket  = ManagerSocketModel.create(server, app, io);

