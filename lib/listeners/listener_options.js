var prime = require('prime');
var type = require('prime/type');
var cluster = require('cluster');

var ListenerOptions = prime({
	_cid: false,
	_sockets: false,
	_options: false,
	_polling: false,
	_pollLoop: false,
	_endpoint: false,
	_emitter: false,
	_setup: {},
	constructor: function(endpoint, io, server, emitter) {
	}
});