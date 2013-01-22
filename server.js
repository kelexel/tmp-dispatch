var express = require('express')
  , RedisStore = require('connect-redis')(express)
  , sessionStore = new RedisStore()
  , app = express()
  , fs = require('fs')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , api = require(__dirname+'/lib/api.js')
  , backend = require(__dirname+'/lib/backend.js');

// auth reference: http://iamtherockstar.com/blog/2012/02/14/nodejs-and-socketio-authentication-all-way-down/

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

io.configure(function() {
    io.set('authorization', function(data, callback) {
      var options = {
          host: app.get('backendHostname'),
          port: app.get('backendPort'),
          path: '/a/'+data.query.phpSessId,
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
      };
      backend.getJSON(options, function(statusCode, result){
        if (statusCode != 200) callback('Error invalid phpSessId', false);
        if (result.auth != 'ok') callback('Error invalid phpSessId', false);
        else callback(null, true);
      });
    });
});
