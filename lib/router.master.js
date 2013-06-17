var prime = require('prime');
var type = require('prime/type');
var cluster = require('cluster');
// var emitter = new (require('prime/emitter'));

module.exports = {
	masterSetup: function(io) {

		if (!this._isMaster) {
			logger.error('CID: '+this._cid+' | masterSetup: but not master!!');
			return;
		}

		var mongoClient = require('mongodb').MongoClient;
 		mongoClient.connect("mongodb://"+_env.get('mongoIP')+":"+_env.get('mongoPort')+"/"+_env.get('mongoDB'), function(err, cacheClient) {
			if(err) throw err;
			logger.info('CID: '+this._cid+' | connected to mongodb');
			cacheClient.collection('cache').drop();
			cacheClient.collection('cache');
			cacheClient.collection('cache').ensureIndex({'eventId': 1}, function(err, res) {
				if (err) throw err;
				cacheClient.collection('cache').ensureIndex({'slideId': 1}, {'unique': true}, function(err, res) {
					if (err) throw err;
					this._cacheClient = cacheClient;
					var loop = this._masterLoop.bind(this, io);
					setInterval(loop, 2000);
					logger.debug('CID: '+this._cid+' | masterSetup: emitter ok');
					// ok v3
					var callback = this._masterProcessEmitterListener.bind(this, io);
					this.helperSetEmitterEvent('master', callback);
					logger.debug('CID: '+this._cid+' | masterSetup: ok');
					logger.info('CID: '+this._cid+' | mongodb driver ready');
				}.bind(this));
			}.bind(this));
		}.bind(this));
	},
	// ok v3
	_masterProcessEmitterListener: function(io, payload) {
		logger.debug('CID: '+this._cid+' | _masterProcessEmitterListener: new message from '+payload.eventWorker);
		// var socket = this.helperGetSocketById(io, payload.socketId);
		// console.log(socket)
		// return
		// console.log(payload)
		switch(payload.eventType) {
			case 'newClient': this._masterClientRegister(io, payload.eventPayload); break;
			case 'setSlide': this._masterClientSlideSet(io, payload.eventPayload); break;
			case 'listCache': this._masterCacheList(io, payload.eventPayload); break;
			default: console.log('unknown payload.eventType ', payload.eventType); break;
		}
	},
	_masterCacheList: function(io, payload) {
		this._cacheClient.collection('cache').find().toArray(function(err, response){
			io.of('/shell').sockets[payload.socketId].emit('shellResponse', {'status': 'ok', 'buffer':  {'cid': this._cid, 'response': response}});
		}.bind(this));

	},
	_masterClientSlideSet: function(io, payload) {
		logger.debug('CID: '+this._cid+' | _masterClientSlideSet: start.. '+payload.socketId);
		if (!payload.socketId) throw Error('missing payloadId!');

		// var socket = this.helperGetSocketById(io, payload.socketId);
		// if (!socket) throw Error(this._CID+': Error Cannot fetch socket!');

		// var socketEndpoint = this.helperGetSocketEndpoint(socket);
		// if (socketEndpoint == '/manager') {
		// 	this.cacheRegister(io, socket);
		// }
		var socket = this.helperGetSocketById(io, '/manager', payload.socketId);
		if (!socket) throw Error(this._CID+': Error Cannot fetch socket!');
		if (this.helperGetSocketEndpoint(socket) != '/manager') throw Error(this._CID+': Error Invalid endpoint!');
		this.cacheRegister(io, socket);
	},
	// ok v3
	_masterClientRegister: function(io, payload) {
		logger.debug('CID: '+this._cid+' | _masterClientRegister: start.. '+payload.socketId);
		if (!payload.socketId) throw Error('missing payloadId!');
		if (!payload.endpoint) throw Error('missing endpoint!');

		var socket = this.helperGetSocketById(io, payload.endpoint, payload.socketId);
		if (!socket) throw Error(this._CID+': Error Cannot fetch socket!');

		try {
			var socketEndpoint = this.helperGetSocketEndpoint(socket);
		} catch (e){
			logger.warn('CID: '+this._cid+' disgarding dead socket '+socket.id);
			// assume it's a dead socket ?
			return;
		}
		logger.debug('CID: '+this._cid+' | _masterClientRegister endpoint '+socketEndpoint);

		if (socketEndpoint == '/manager') {
			this.cacheRegister(io, socket);
		} else if (socketEndpoint == '/shell') {
			this.shellAttach(io, socket);
		}


		logger.debug('CID: '+this._cid+' | _masterClientRegister: ok '+payload.socketId);

	},
	// ok v3
	_masterLoop: function(io) {
		this.cacheFetchManagerSlideContent(io);
	}
}