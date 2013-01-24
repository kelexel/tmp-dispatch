var express = require('express')
  , RedisStore = require('connect-redis')(express)
  , sessionStore = new RedisStore()
  , app = express()
  , fs = require('fs')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , api = require(__dirname+'/lib/api.js');


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

server.listen(8999);

// express setup
//var app = express();
app.configure(function() {
  app.set('backendHostname', 'iconference');
  app.set('backendPort', 80);

  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'helloworld',
     store: sessionStore
  }));  
  app.use(express.bodyParser());
  app.use(app.router);
  // serve up static file if found
  app.use('/', express.static(__dirname + '/public'));
  // // serve up api routes next
  // api.create(app);
  // everything else gets index.html
  app.use('/', function (req, res, next) {
    fs.readFile(__dirname + '/public/index.html', 'utf8', function (err, data) {
      res.end(data);
    });
  });
});

// auth configuration
// reference: http://iamtherockstar.com/blog/2012/02/14/nodejs-and-socketio-authentication-all-way-down/
// io.configure(function() {
//     io.set('authorization', function(data, callback) {
//         var obj = require(__dirname+'/lib/socketsession.js');
//         obj.authorize(app, data, callback);
//     });
// });

// socket concifugration
// var publicSocket = io
//   .configure(function() {
//       io.set('authorization', function(data, callback) {
//           var obj = require(__dirname+'/lib/socketsession.js');
//           obj.authorizePublic(app, data, callback);
//       });
//   })
//   .of('/public')
//   .on('connection', function (socket) {
//     var callback = function(data) {
//       socket.emit('welcome', data);
//     }
//   var backend = require(__dirname+'/lib/backend.js');
//   backend.getCurrentSlide(app, socket, callback);
// });
var PublicSocketModel = require(__dirname+'/lib/publicsocket.js');
var PublicSocket  = PublicSocketModel.create(server, app, io);
server.addListener('publicSendRefreshOptions', PublicSocket.sendRefreshOptions);

var DisplaySocketModel = require(__dirname+'/lib/displaysocket.js');
var DisplaySocket  = DisplaySocketModel.create(server, app, io);
server.addListener('displaySendRefreshOptions', DisplaySocket.sendRefreshOptions);

var ManagerSocketModel = require(__dirname+'/lib/managersocket.js');
var ManagerSocket  = ManagerSocketModel.create(server, app, io);





