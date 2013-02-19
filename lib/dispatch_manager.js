var prime = require('prime');
var Dispatcher = require('./dispatcher.js');

module.exports = prime({
	inherits: Dispatcher,
	_sockets: {},
	_options: {},
	_dispatcherTyper: 'manager',
	_companyPrefix: 'SocketManager',
	constructor: function(io, server) {
		Dispatcher.call(this, io, server);
	},
	socketAttachEvents: function(server, io, socket) {
		socket.on('setSlideOption', this.socketSetOptionsListener.bind(this, server, io, socket));
		socket.on('sendCommand', this.socketSendCommandListener.bind(this, server, io, socket));
	}
});