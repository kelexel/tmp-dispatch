var prime = require('prime');
var type = require('prime/type');
var cluster = require('cluster');
var async = require('async');


var App = prime({
	_cid: false,
	_emitter: false,
	_isMaster: false,
	_endpoints: false,
	constructor: function(io, server, emitter) {
		this._cid = this.helperGetClusterId();
		this._emitter = emitter;
		this._isMaster = (this._cid == '99' || this._cid == '1');
		this._endpoints = {'workers': ['manager', 'public', 'display', 'shell']};
		async.series([
			this.ioSetup(io),
			this.masterSetup(io),
			this.frontendSetup(io),
			this.shellSetup(io)
		]);
	},

	_readySocket: function(io, socket) {
		var socketEndpoint = this.helperGetSocketEndpoint(socket);
		if (socketEndpoint != '/shell') {
			socket.join(this.helperGetSession(socket, 'eventHash'));
			this.frontendAttach(io, socket);
		} else {
			this.shellAttach(io, socket);
		}
		var session = this.helperGetSession(socket);
		socket.emit('welcome', {'slide': session.slide, 'auth': true, 'state': 'ok'});
		logger.debug('CID: '+this._cid+' | _masterClientRegister: registered new '+socketEndpoint+' socketId '+socket.id);
		this.eventsInternalPropagate('Master', 'newClient', {'socketId': socket.id, 'endpoint': socketEndpoint});
		logger.verbose('CID: '+this._cid+' | new socket '+socket.id+' on '+socket.namespace.name);
	}

});
['IO', 'Helper', 'Frontend', 'Events', 'Master', 'Backend', 'Shell', 'Cache'].forEach(function(prm){
	App.implement(require('./'+prm.toLowerCase()+'.js'));
});
module.exports = App;