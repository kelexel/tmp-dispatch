var prime = require('prime');
var Dispatcher = require('./dispatcher.js');

module.exports = prime({
	inherits: Dispatcher,
	_dispatcherTyper: 'shell',
	constructor: function(io, server) {
		Dispatcher.call(this, io, server);
	},
	socketAttachEvents: function(server, io, socket) {
		socket.on('shell', this.shellListener.bind(this, server, io, socket));
	},
	socketOnConnect: function(server, io, socket) {
		this.socketAttachEvents(server, io, socket);
	},
	shellListener: function(server, io, socket, payload){
		console.log('shell payload', payload)
		if (!payload.dispatchers) payload.dispatchers = ['manager'];
		console.log('received payload', payload)
		this.eventPropagateToDispatchers(server, io, socket, 'shell', payload);
	}
});