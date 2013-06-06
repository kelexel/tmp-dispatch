var prime = require('prime');
var type = require('prime/type');
var cluster = require('cluster');
// var emitter = new (require('prime/emitter'));

module.exports = {
	masterSetup: function(io) {
		// if (this._cid == 99 || this._cid == 1) {
		// 	console.log('set loop!')
		// 	console.log('set loop!')
		// 	console.log('set loop!')
		// 	console.log('set loop!')
		// 	console.log('set loop!')
		// 	var loop = this._masterLoop.bind(this, io);
		// 	setInterval(loop, 2000);
		// 	logger.debug('CID: '+this._cid+' | masterSetup: emitter ok');
		// }
		if (!this._isMaster) {
			logger.error('CID: '+this._cid+' | masterSetup: but not master!!');
			return;
		}

		// ok v3
		var callback = this._masterProcessEmitterListener.bind(this, io);
		this.helperSetEmitterEvent('master', callback);
			logger.debug('CID: '+this._cid+' | masterSetup: ok');

		var mongoClient = require('mongodb').MongoClient;

 		mongoClient.connect("mongodb://"+_env.get('mongoIP')+":"+_env.get('mongoPort')+"/"+_env.get('mongoDB'), function(err, cacheClient) {
			if(err) throw err;
			console.log("Connected to Database");
			cacheClient.createCollection("testCollection", function(err, collection){
				if (err) throw err;
				console.log("Created testCollection");
			});
			this._cacheClient = cacheClient;
		}.bind(this));

	},
	// ok v3
	_masterProcessEmitterListener: function(io, payload) {
		logger.debug('CID: '+this._cid+' | _masterProcessEmitterListener: new message from '+payload.eventWorker);
		// var socket = this.helperGetSocketById(io, payload.socketId);
		// console.log(socket)
		// return

		switch(payload.eventType) {
			case 'newClient': this._masterClientRegister(io, payload.eventPayload); break;
		}
	},
	// ok v3
	_masterClientRegister: function(io, payload) {
		logger.debug('CID: '+this._cid+' | _masterClientRegister: start.. '+payload.socketId);
		if (!payload.socketId) throw Error('missing payloadId!');

		var socket = this.helperGetSocketById(io, payload.socketId);
		// var socket = payload.socket;
		if (!socket) throw Error(this._CID+': Error Cannot fetch socket!');

		var socketEndpoint = this.helperGetSocketEndpoint(socket);
		if (socketEndpoint != '/shell') {
			this.cacheRegister(io, socket);
		} else {
			this.shellAttach(io, socket);
		}


		logger.debug('CID: '+this._cid+' | _masterClientRegister: ok '+payload.socketId);

	},
	// ok v3
	_masterLoop: function(io) {
		console.log('master');
		this.cacheFetchManagerSlideContent(io);
	}
}