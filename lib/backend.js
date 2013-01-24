var http = require("http")
    , https = require("https")
    , express = require('express')
    , app = express();

/**
 * getJSON:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
exports.getJSON = function(options, callback, cookie)
{
    console.log("rest::getJSON.path:", options.path);

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
            try{
                var obj = JSON.parse(output);
            } catch(e) {
                console.log(e)
                console.log('output was : ', output);
                callback(500, obj);
            }
            callback(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        //res.send('error: ' + err.message);
    });

    req.end();
};

exports.getCurrentSlide = function(app, socket, callback)
{
    var session = socket.handshake._session;
//  //    console.log(app)
      var options = {
          host: app.get('backendHostname'),
          port: app.get('backendPort'),
          path: '/'+session.eventCode+'/get/state'+'?sessId='+session.phpSessId,
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
      };
      this.getJSON(options, function(statusCode, result){
        callback(result);
      });
}

exports.setSlideOption = function(app, socket, options, callback)
{
    if (!options.slideId || !options.optionName || !options.optionValue)
        return callback({'status': 'error', 'log': 'invalid slide options'});

    var session = socket.handshake._session;
//  //    console.log(app)
      var options = {
          host: app.get('backendHostname'),
          port: app.get('backendPort'),
          path: '/h/'+session.eventHash+'/manager/embed/'+options.slideId+'/options/?n='+options.optionName+'&v='+options.optionValue,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': session.name+'='+session.id
        }
      };
      this.getJSON(options, function(statusCode, result){
        callback(result);
      }, session);
}