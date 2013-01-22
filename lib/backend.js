var http = require("http")
    , https = require("https")
    , express = require('express')
    , app = express();

/**
 * getJSON:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
exports.getJSON = function(options, onResult)
{
     console.log("rest::getJSON", options);

    var prot = options.port == 443 ? https : http;
    var req = prot.request(options, function(res)
    {
        var output = '';
        //console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function() {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        //res.send('error: ' + err.message);
    });

    req.end();
};

exports.getCurrentSlide = function(socket, onResult)
{
    var session = socket.handshake._session;
//  //    console.log(app)
      var options = {
          host: app.get('backendHostname'),
          port: app.get('backendPort'),
          path: '/get/state'+'?sessId='+session.phpSessId+'&eventHash='+session.eventHash,
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
      };
      this.getJSON(options, function(statusCode, result){
        onResult(result);
      });
}