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
	_cachedSlides: false,
	_cacheClient: false,
	constructor: function(io, server, emitter) {
		this._endpoints.workers
		this._endpoints = {'workers': ['manager', 'public', 'display', 'shell']};
		// this._endpoint = endpoint;
		this._cachedSlides = {};
		this._cid = this.helperGetClusterId();
		this._emitter = emitter;
		this._isMaster = (this._cid == '99' || this._cid == '1');

		this.ioSetup(io);
		if (this._isMaster) {
			this._cachedSlides = {};
			this.masterSetup(io);
			this.shellSetup(io);
		}
		this.frontendSetup(io);


		// if (this._cid != 1) {
		// 	this.frontendSetup(io);
		// }
		// if (this._endpoint != 'shell') {
		// 	this.cacheSetup(io);
		// 	this.shellSetup(io);
		// }

	},

	_readySocket: function(io, socket) {
		console.log('readyyy byt not authojiojio')
		// return;
		// this.helperPropagateEmitterEvent('master', 'newClient', {'socketId': socket.id, 'socket': socket});
		// this.helperPropagateEmitterEvent('master', 'newClient', {'socketId': socket.id});

		var socketEndpoint = this.helperGetSocketEndpoint(socket);
		if (socketEndpoint != '/shell') {
			socket.join(this.helperGetSession(socket, 'eventHash'));
			// this.cacheRegister(io, socket);
			this.frontendAttach(io, socket);
			// if (socketEndpoint == '/manager')
			// 	this.backendAttach(io, socket);
			// if (socketEndpoint == '/public') 
				this._welcomeSocket(socket);

			logger.debug('CID: '+this._cid+' | _masterClientRegister: registered new '+socketEndpoint+' socketId '+socket.id);
		} else {
			this.shellAttach(io, socket);
			logger.debug('CID: '+this._cid+' | _masterClientRegister: registered new '+socketEndpoint+' socketId '+socket.id);
		}


		this.helperPropagateEmitterEvent('master', 'newClient', {'socketId': socket.id});

		logger.log('CID: '+this._cid+' | new socket '+socket.id+' on '+socket.namespace.name);
		// if (this._endpoint != 'shell') {
		// 	console.log('shell')
		// 	console.log('shell')
		// 	console.log('shell')
		// 	console.log('shell')
		// 	console.log('shell')
		// 	console.log('shell')
		// }
return;
		if (this._endpoint != 'shell') {
			socket.join(this.helperGetSession(socket, 'eventHash'));
			this.cacheAttach(io, socket);
			this.frontendAttach(io, socket);
		} else {
			this.shellAttach(io, socket);
		}
		if (this._endpoint == 'manager')
			this.backendAttach(io, socket);
		logger.log('CID: '+this._cid+' | '+this._endpoint+' READY');
	},
	_welcomeSocket: function(socket) {
		var session = this.helperGetSession(socket);
		socket.emit('welcome', {'slide': session.slide, 'auth': true, 'state': 'ok'});
		console.log(session)
	}
});
var loaded = {};
['Helper', 'IO', 'Shell', 'Frontend', 'Backend', 'Cache', 'Master'].forEach(function(prm){
	Router.implement(require('./router.'+prm.toLowerCase()+'.js'));
});
module.exports = Router;