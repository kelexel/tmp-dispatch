var express = require('express')
  , RedisStore = require('connect-redis')(express)
  , sessionStore = new RedisStore()
  , app = express()
  , fs = require('fs')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , api = require(__dirname+'/lib/api.js');


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
  // serve up api routes next
  api.create(app);
  // everything else gets index.html
  app.use('/', function (req, res, next) {
    fs.readFile(__dirname + '/public/index.html', 'utf8', function (err, data) {
      res.end(data);
    });
  });
});

// auth reference: http://iamtherockstar.com/blog/2012/02/14/nodejs-and-socketio-authentication-all-way-down/
io.configure(function() {
    io.set('authorization', function(data, callback) {
        var obj = require(__dirname+'/lib/socketsession.js');
        obj.authorize(app, data, callback);
        console.log('data._session should be set but is undefined here', data._session)
    });

});

io.sockets.on('connection', function (socket) {
    var emit = function(slideId) {
      socket.emit('welcome', { slideId: slideId });
    }
  var backend = require(__dirname+'/lib/backend.js');
  backend.getCurrentSlide(app, socket, emit);
});
