var prime = require('prime');
var Dispatcher = require('./dispatcher.js');

// exports.DispatchManager = prime({
module.exports = prime({
	inherits: Dispatcher,
	_sockets: {},
	_options: {},
	_dispatcherTyper: 'manager',
	_companyPrefix: 'SocketManager',
	constructor: function(io, server) {
		Dispatcher.call(this, io, server);
		// Dispatcher.prototype.constructor.call(this, io, server, {'dispatcherType': 'manager'});
		// this.constructor.parent.constructor.call(this,  io, server, {'dispatcherType': 'manager'});
		// this.parent.constructor.call(this, io, server, {'dispatcherType': 'manager'});													// "weird result"
	},
	socketAttachEvents: function(server, socket) {
		socket.on('setSlideOption', this.socketSetOptionsListener.bind(this, server, socket));
		socket.on('sendCommand', this.socketSendCommandListener.bind(this, server, socket));
	}

});
