var prime = require('prime');
var type = require('prime/type');
// console.log(emitter);
// return;
// var Map = require('prime/map')
// var map = Map()
var cluster = require('cluster');


var Router = prime({
	_cid: false,
	_isMaster: false,
	_endpoints: false,
	_emitter: false,
	constructor: function(io, server, emitter) {
		this._endpoints.workers
		this._endpoints = {'workers': ['manager', 'public', 'display', 'shell']};
		// this._endpoint = endpoint;
		this._cachedSlides = {};
		this._cid = this.helperGetClusterId();
		this._emitter = emitter;
		this._isMaster = (this._cid == '99' || this._cid == '1');

		this.ioSetup(io);
		this.frontendSetup(io);
		if (this._isMaster) {
			this.masterSetup(io);
			this.shellSetup(io);
		}


		// if (this._cid != 1) {
		// 	this.frontendSetup(io);
		// }
		// if (this._endpoint != 'shell') {
		// 	this.cacheSetup(io);
		// 	this.shellSetup(io);
		// }

	},

	_readySocket: function(io, socket) {

		var socketEndpoint = this.helperGetSocketEndpoint(socket);
		if (socketEndpoint != '/shell') {
			socket.join(this.helperGetSession(socket, 'eventHash'));
			this.frontendAttach(io, socket);
			this._welcomeSocket(socket);

			logger.debug('CID: '+this._cid+' | _masterClientRegister: registered new '+socketEndpoint+' socketId '+socket.id);
		} else {
			this.shellAttach(io, socket);
			logger.debug('CID: '+this._cid+' | _masterClientRegister: registered new '+socketEndpoint+' socketId '+socket.id);
		}
		this.helperPropagateEmitterEvent('master', 'newClient', {'socketId': socket.id});

		logger.log('CID: '+this._cid+' | new socket '+socket.id+' on '+socket.namespace.name);
	},
	_welcomeSocket: function(socket) {
		var session = this.helperGetSession(socket);
		socket.emit('welcome', {'slide': session.slide, 'auth': true, 'state': 'ok'});
	}
});
var loaded = {};
['Helper', 'IO', 'Shell', 'Frontend', 'Backend', 'Cache', 'Master'].forEach(function(prm){
	Router.implement(require('./router.'+prm.toLowerCase()+'.js'));
});
module.exports = Router;