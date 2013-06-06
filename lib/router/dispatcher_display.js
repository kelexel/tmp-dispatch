var prime = require('prime');
var Dispatcher = require('./dispatcher.js');

module.exports = prime({
	inherits: Dispatcher,
	_dispatcherTyper: 'display',
	constructor: function(io, server) {
		Dispatcher.call(this, io, server);
	},
	socketAttachEvents: function(server, io, socket) {
		// socket.on(this._interfaceType+'setSlideOption', this.socketSlideOptionListener.bind(this, server, socket));
	}
});
