var sys = require("sys");

var stdin = process.openStdin()
, io = require('socket.io-client')
, logger = require(__dirname+'/logger.js')

global._ = require(__dirname+'/../etc/init_prime.js');
global._env = require(__dirname+'/../etc/env.js');
var type = require('prime/type');

console.log('connecting to', _env.get('shellUrl').toString()+'/shell')
var con = io.connect(_env.get('shellUrl').toString()+'/shell', {query: 'foo=bar'});

var output = function(buffer, indent) {
	if (indent > 0) {
		var prefix = '', i=0;
		for (i=1; i<= indent; i++) {
			prefix = prefix+". ";
		}
	} else
		var prefix = ". ";

	if (type(buffer) != 'object' && type(buffer) != 'array')
		console.log(prefix+buffer);
	else {
		_(buffer).each(function(v, k){
			if (type(v) != 'object' && type(v) != 'array') {
				k = k != 'dispatcher' ? prefix+k+':' : k+':';
				console.log(k, v);
			} else {
				indent++;
				console.log(prefix+k+':');
			// console.log(prefix+k);
				output(v, indent);
				indent--;
			}
			// console.log(k, v);
		});
	}
}
// socket.on('*', function(resp) {
// 	console.log('debug')
// 	console.log(resp)
// })
con.on('connect', function() {
	console.log('connected! (sid: '+con.socket.sessionid+')');
});
con.on('diconnect', function() {
	console.log('!! disconnected!');
});
con.on('shellResponse', function(payload) {
	if (payload.status == 'ok') {
		output(payload.buffer, 0);
	} else
		logger.error(payload.buffer.toString());
});


var commands = {
	'lr': {
		'command': function(args) {
			con.emit('shellQuery', {'cmd': 'listRooms'});
			logger.info('emitted listRooms');
		},
		'help': "lr\t\t\t List Rooms"
	},
	'ls': {
		'command': function(args) {
			var nargs = {};
			if (!args[0]) return logger.error('missing roomHash!');
			nargs['target'] = args[0];
			if (args[1]) {
				if (_(['manager', 'display', 'public', 'shell']).indexOf(args[1]) == -1) {
					return logger.error('Invalid dispatcher '+args[1]);
				}
				nargs['dispatchers'] = [];
				nargs['dispatchers'].push(args[1]);
			}
			con.emit('shellQuery', {'cmd': 'listSockets', 'args': nargs});
			logger.info('emitted listSockets for room ', args[0]);
		},
		'help': "ls <roomHash> <dispatcher>\t\t List Sockets for <roomHash> in <dispatcher> (default 'manager')"
	},
	'lp': {
		'command': function(args) {
			con.emit('shellQuery', {'cmd': 'listPollings'});
			logger.info('emitted listPollings for manager');
		},
		'help': "lp\t\t\t List current slide being pulled"
	},
	'lc': {
		'command': function(args) {
			con.emit('shellQuery', {'cmd': 'listCache'});
			logger.info('emitted listCache for manager');
		},
		'help': "lc\t\t\t List current cached slides"
	},
	'rp': {
		'command': function(args) {
			nargs = {};
			var eventPayload = {};
			if (!args[0]) return logger.error('missing url!');
			eventPayload['commandArgs'] = {'url': args[0]};

			if (!args[1]) return logger.error('missing roomHash!');
			eventPayload['room'] = args[1];

			if (args[2]) {
				if (_(['manager', 'display', 'public', 'shell']).indexOf(args[2]) == -1) {
					return logger.error('Invalid dispatcher '+args[1]);
					}
			} else {
				args[2] = '/public';
			}
			eventPayload['endpointDst'] = args[2];
			eventPayload['command'] = 'refreshURL';

			nargs['eventType'] = 'command';
			nargs['eventPayload'] =  eventPayload;

			con.emit('shellQuery', {'cmd': 'refreshPage', 'args': nargs});
			logger.info('emitted refreshPage for room ', args[0]);

		},
		'help': "rp <url>\t\t send refresh page to url"
	}
}


stdin.addListener("data", function(d) {
	// note:  d is an object, and when converted to a string it will
	// end with a linefeed.  so we (rather crudely) account for that  
	// with toString() and then substring() 
	var cmd, args = d.toString().substring(0, d.length-1);
	args = args.split(' ');
	cmd = args[0];
	// switch (cmd) {
		if (commands[cmd]) {
			args.shift();
			commands[cmd]['command'](args);
		// break;
		} else if (cmd == 'help' || cmd == '?') {
		// default:
			_(commands).each(function(att, cmd) {
				logger.info(att.help);
			});
		} else
			console.log();
		// break;
	// }
  });