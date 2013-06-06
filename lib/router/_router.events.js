var prime = require('prime');
module.exports = {
	_eventIOConnect: function(server, io, socket) {
		console.log('')
		console.log('')
		console.log('')
		console.log('')
		console.log('')
		console.log('')
		// this._sockets[socket.id] = socket;
		socket.handshake._session.endpoint = socket.flags.endpoint;
		var session = socket.handshake._session;
		if (!session.eventHash) return this.logout();
		socket.join(session.eventHash);
		logger.info('CID: '+this._cid+' + New client', {socket: socket.id, sessionId: session.token, interface: session.interface, slide: session.slide.id, endpoint: session.endpoint, room: session.eventHash});
		var r = {'state': 'ok'};
		if (!session || !session.token || !session.cookie)
			r.auth = false;
		else {
			r.auth = true;
			r.slide = session.slide ? session.slide : false;
		}

		// socket.emit('welcome', r);
		this.socketAttachEvents(server, io, socket);
	}
};