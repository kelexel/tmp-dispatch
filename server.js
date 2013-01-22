var express = require('express')
	, app = express()
	, fs = require('fs')
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , api = require(__dirname+'/lib/api.js');


var paths = {
	'htdocs': __dirname + '/htdocs'
}

io.configure(function (){
  io.set('authorization', function (handshakeData, callback) {
//    callback(null, true); // error first callback style
    console.log(handshakeData);
    validateClientCookie(handshakeData.address.address, function (err, data) {
      if (err) return callback(err);

      if (data.authorized) {
        handshakeData.foo = 'bar';
        for(var prop in data) handshakeData[prop] = data[prop];
        callback(null, true);
      } else {
        callback(null, false);
      }
    })
  });
});

server.listen(8999);

// express setup
//var app = express();
app.configure(function() {
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
