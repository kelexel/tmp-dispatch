var prime = require('prime');
var Dispatcher = require('./dispatcher.js');

module.exports = prime({
	inherits: Dispatcher,
	// _sockets: {},
	// _options: {},
	_dispatcherTyper: 'public',
	// _companyPrefix: 'SocketPublic',
	constructor: function(io, server) {
		Dispatcher.call(this, io, server);
	},
	socketAttachEvents: function(server, io, socket) {
		// socket.on(this._interfaceType+'setSlideOption', this.socketSlideOptionListener.bind(this, server, socket));
	}
});