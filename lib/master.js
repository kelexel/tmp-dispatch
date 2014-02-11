var prime = require('prime');
var object = require('prime/shell/object');
var array = require('prime/shell/array');
var type = require('prime/type');
var cluster = require('cluster');
var async = require('async');
// var emitter = new (require('prime/emitter'));
var levelup = require('levelup');
var slide = new (require(__dirname+'/slide.js'));
module.exports = {
	_masterloopRunning: false,
	_masterloopRunningCount: false,
	_memoryStore: false,
	masterSetup: function(io, callback) {
		if (!this._isMaster) return;

		this._memoryStore = {};

		var cb = this._masterListener.bind(this, io);
		this.eventsInternalSetup('Master', cb);
		async.series([
			this._masterSetupCache.bind(this),
			this._masterSetupLoop.bind(this, io)
		], function(err, res) {
			logger.info('CID: '+this._cid+' | masterSetup complete');
		}.bind(this));
	},
	_masterSetupCache: function(parentCallback) {
		var cid = this._cid;
		async.waterfall([
			function(callback) {
				console.log('------------')
				console.log('CONNECTING TO CACHE CLIENT')
				console.log('------------')
				var db = levelup(__dirname+'/../var/cache', {
					createIfMissing: true,
					valueEncoding: 'json'
				});
				db.put('events', {}, function() {
					callback(false, db);
				});
			},
			function(cacheClient, callback) {
				this._cacheClient = cacheClient;
				callback(false, true);
			}.bind(this)
		], function(err, res){
			if (err) logger.error('Cannot connect to mongodb !!!!');
			if (res) logger.info('CID: '+cid+' | cacheClient ready');
			parentCallback(err, res);
		});
	},
	_masterSetupLoop: function(io, callback) {
		var loop = this._masterLoop.bind(this, io);
		setInterval(loop, _env.get('pullDelay'));
		logger.debug('CID: '+this._cid+' | masterSetup: emitter ok');
		callback(null, true);
	},
	_masterListener: function(io, payload) {
		logger.debug('CID: '+this._cid+' | _masterListener: new message from '+payload.eventWorker);
		switch(payload.eventType) {
			case 'newClient': this._masterClientRegister(io, payload.eventPayload); break;
			case 'setSlide': this._masterClientSlideSet(io, payload.eventPayload); break;
			case 'listCache': this._masterCacheList(io, payload.eventPayload); break;
			case 'listSockets': this._shellSocketsList(io, payload.eventPayload); break;
			default: console.log('unknown payload.eventType ', payload.eventType); break;
		}
	},
	_masterCacheList: function(io, payload) {
		var socket = this.helperGetSocketById(io, '/shell', payload.socketId);
		var nr = this._memoryStore;
		// console.log('replying')
		// console.log(this._memoryStore)
		socket.emit('shellResponse', {'status': 'ok', 'buffer':  {'cid': this._cid, 'response': nr}});
	},
	_masterClientSlideSet: function(io, payload) {
		logger.debug('CID: '+this._cid+' | _masterClientSlideSet: start.. '+payload.socketId);
		if (!payload.socketId) throw Error('missing payloadId!');
		var socket = this.helperGetSocketById(io, payload.endpointSrc, payload.socketId);
		if (!socket) throw Error(this._CID+': Error Cannot fetch socket! Client disconnected ?');

		var session = this.helperGetSession(socket);
		this._masterPopClient(session, socket);
		this.helperSetSession(socket, 'slide', payload.commandArgs.slide);
		this._masterPushClient(session, socket);
	},
	_masterClientRegister: function(io, payload) {
		logger.debug('CID: '+this._cid+' | _masterClientRegister: start.. '+payload.socketId);
		if (!payload.socketId) throw Error('missing payloadId!');
		if (!payload.endpoint) throw Error('missing endpoint!');

		var socket = this.helperGetSocketById(io, payload.endpoint, payload.socketId);
		if (!socket) {
			return;
		}
		try {
			var socketEndpoint = this.helperGetSocketEndpoint(socket);
		} catch (e){
			logger.warn('CID: '+this._cid+' disgarding dead socket '+socket.id);
			return;
		}
		logger.debug('CID: '+this._cid+' | _masterClientRegister endpoint '+socketEndpoint);
		if (socketEndpoint == '/manager' || socketEndpoint == '/display') {
			var session = this.helperGetSession(socket);
			this._masterPushClient(session, socket);
		}
		logger.debug('CID: '+this._cid+' | _masterClientRegister: ok '+payload.socketId);
	},
	_masterPushClient: function(session, socket) {
		if (!this._memoryStore[session.slide.id]) this._memoryStore[session.slide.id] =  {'eventId': session.eventHash, 'type': session.slide.slideType, 'clients': [], 'md5': false};
		if (!this._memoryStore[session.slide.id].clients || type(this._memoryStore[session.slide.id].clients) != 'array') this._memoryStore[session.slide.id].clients = [];
		// console.log('pushing '+socket.id)
		this._memoryStore[session.slide.id].clients.push(socket.id);
		// console.log(this._memoryStore)
	},
	_masterPopClient: function(session, socket) {
		// console.log('removing '+socket.id)
		if (!this._memoryStore[session.slide.id] || !this._memoryStore[session.slide.id].clients) return;
		array.remove(this._memoryStore[session.slide.id].clients, socket.id);
		if (this._memoryStore[session.slide.id].clients.length == 0) delete this._memoryStore[session.slide.id];
	},
	_masterLoop: function(io) {
		if (this._masterloopRunning) {
			this._masterloopRunningCount++;
			logger.warn('CID: '+this._cid+' | _masterLoop already running !!');
			if (this._masterloopRunningCount >= 5) {
				logger.error('CID: '+this._cid+' | _masterLoop is stuck !!')
				this._masterloopRunningCount = 0;
				this._masterloopRunning= false;
			}
			return;
		}
		this._masterloopRunning = true;
		async.series([
			this.cachePurge.bind(this, io),
			this.cacheFetchAll.bind(this, io),
			function(callback) { this._masterloopRunning = false; this._cacheLastFetch = Date.now(); callback(null); }.bind(this)
		], function(err) {
			if (err) {
				console.log('!!!!!!!!!!!!!!!!')
				logger.error('_masterLoop error ', err);
				this._masterloopRunning = false;
				console.log('!!!!!!!!!!!!!!!!')
			}
		}.bind(this))
	}
}