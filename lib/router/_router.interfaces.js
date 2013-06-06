var prime = require('prime');

module.exports = {
	publicEmitLoadSlide: function(socket) {
		var session = this.helperGetSession(socket);
		socket.emit('welcome', {'slide': session.slide, 'auth': true, 'state': 'ok'});
		console.log(session)
	}
};