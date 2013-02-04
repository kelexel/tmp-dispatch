var prime = require('prime');
var Dispatcher = require('./dispatcher.js');

// exports.DispatchPublic = prime({
module.exports = prime({
	inherits: Dispatcher,
	_sockets: {},
	_options: {},
	_dispatcherTyper: 'public',
	_companyPrefix: 'SocketPublic',
	constructor: function(io, server) {
		// Dispatcher.call(this, io, server, {'dispatcherType': 'manager'});
		Dispatcher.prototype.constructor.call(this, io, server);
		// this.constructor.parent.constructor.call(this,  io, server, {'dispatcherType': 'public'});
		// this.parent.constructor.call(this, io, server, {'dispatcherType': 'manager'});													// "weird result"
	},
	socketAttachEvents: function(server, socket) {
		// socket.on(this._interfaceType+'setSlideOption', this.socketSlideOptionListener.bind(this, server, socket));
	}

});
