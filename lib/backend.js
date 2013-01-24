// i think i should not do the following ? or should i to get access to these in the exports.myFn bellow ?
var http = require("http")
		, https = require("https")
		, express = require('express')
		, app = express();

// there is probably a better middleware to do this, but at least i can configure it myself
// note, cookie is very important as it will contain the phpSessionId that the http object will use when querying the backend
exports.getJSON = function(options, callback, cookie)
{
		console.log("rest::getJSON.path:", options.path);

		var prot = options.port == 443 ? https : http;

		var req = prot.request(options, function(res)
		{
				var output = '';
				res.setEncoding('utf8');

				res.on('data', function (chunk) {
						output += chunk;
				});

				res.on('end', function() {
					// attempt to JSONify the resulting string
						try{
								var obj = JSON.parse(output);
						} catch(e) {
								// but if it fails, for now, just spit out the output to console .. (there should be a better way of doing this!)
								console.log(e)
								console.log('output was : ', output);
								callback(500, obj);
						}
						callback(res.statusCode, obj);
				});
		});
		// not used for now, but again, it should be.
		req.on('error', function(err) {
				//res.send('error: ' + err.message);
		});

		req.end();
};


// bellow are all methods used to communicate to the backend (using the user passed phpSessionId)
// the result is always fed back to the client.
// there should be an extra check of the result spit by the backend, still the backend API spits back things like status="ok"|"error" on each call..



// used to get the current slide to be displayed by a public user
// when a user logs in to /public he gives us his phpSessionId, which is here used to ask the backend what slide should we load
// notice how i'm passing "app" to it because i do not know how to access them from within my function 
exports.getCurrentSlide = function(app, socket, callback)
{
		var session = socket.handshake._session;
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

// used to set an option on any interface, by a manager (backend ensures the passed in phpSessionId matches a "manager role" user)
exports.setSlideOption = function(app, socket, options, callback)
{
		if (!options.slideId || !options.optionName || !options.optionValue)
				return callback({'status': 'error', 'log': 'invalid slide options'});

		var session = socket.handshake._session;
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