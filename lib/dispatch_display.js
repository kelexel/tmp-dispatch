var prime = require('prime');
var type = require('prime/type');
var Dispatcher = require('./dispatcher.js');

// exports.DispatchDisplay = prime({
module.exports = prime({
	inherits: Dispatcher,
	_sockets: {},
	_options: {},
	_dispatcherTyper: 'display',	
	constructor: function(io, server) {
		// Dispatcher.call(this, io, server,  {'dispatcherType': 'display'})
		Dispatcher.call(this, io, server);
		// Dispatcher.prototype.constructor.call(this, io, server);
			// this.constructor.parent.constructor.call(this,  io, server, {'dispatcherType': 'display'});
	// this.parent.constructor.call(this, io, server, {'dispatcherType': 'display'});													// "weird result"

	},
	socketAttachEvents: function(server, io, socket) {
		// socket.on(this._interfaceType+'setSlideOption', this.socketSlideOptionListener.bind(this, server, socket));
	}
});
