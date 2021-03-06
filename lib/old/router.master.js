var prime = require('prime');
var object = require('prime/shell/object');
var type = require('prime/type');
var cluster = require('cluster');
var async = require('async');
// var emitter = new (require('prime/emitter'));
var levelup = require('levelup');
module.exports = {
	_masterloopRunning: false,
	_masterloopRunningCount: false,
	masterSetup: function(io) {

		if (!this._isMaster) {
			logger.error('CID: '+this._cid+' | masterSetup: but not master!!');
			return;
		}

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
				// var mongoClient = require('mongodb').MongoClient;
				// mongoClient.connect("mongodb://"+_env.get('mongoIP')+":"+_env.get('mongoPort')+"/"+_env.get('mongoDB'), callback);
				var db = levelup('./mydb', {
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
return callback(null, true);

		var cb = this._masterProcessEmitterListener.bind(this, io);
		this.helperSetEmitterEvent('master', cb);

		var loop = this._masterLoop.bind(this, io);
		setInterval(loop, _env.get('pullDelay'));
		logger.debug('CID: '+this._cid+' | masterSetup: emitter ok');
		// ok v3
		callback(null, true);
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
			case 'listSockets': this._masterSocketsList(io, payload.eventPayload); break;
			default: console.log('unknown payload.eventType ', payload.eventType); break;
		}
	},
	_masterCacheList: function(io, payload) {
		this._cacheClient.collection('cache').find({$where: "this.clients.length > 0"}).toArray(function(err, response){
			var socket = this.helperGetSocketById(io, '/shell', payload.socketId);
			if (!socket) throw Error('woops shit');
			var nr = [];
			nr.push({'cache last fetched on': new Date(this._cacheLastFetch)});
			response.forEach(function(resp){
				delete resp.data;
				nr.push(resp)
			});
			// io.of('/shell').sockets[payload.socketId].emit('shellResponse', {'status': 'ok', 'buffer':  {'cid': this._cid, 'response': response}});
			socket.emit('shellResponse', {'status': 'ok', 'buffer':  {'cid': this._cid, 'response': nr}});
		}.bind(this));
	},
	_masterSocketsList: function(io, payload) {
				// var endpoint = this.helperGetSocketEndpoint(socket);
		logger.verbose('CID: '+this._cid+' | _masterSocketsList: start.. '+payload.socketId);
		var data = {}, rooms = this.helperGetDispatcherRooms(io), target = payload.room, r;
		object.each(rooms, function(sockets, rid){
			// console.log('rid',rid);
			// console.log('sockets',sockets);
			r = rid.split('/');
			if (r[1] == target || r[2] == target) {
				if (!data[rid]) data[rid] = [];
				sockets.forEach(function(socket) {
					if (io.connected[socket])
						data[rid].push(socket)
				})
			}
		});
		var socket = this.helperGetSocketById(io, '/shell', payload.socketId);
		if (!socket) return;
		socket.emit('shellResponse', {'status': 'ok', 'buffer': {'cid': this._cid, 'response': data.valueOf()}});
		logger.verbose('CID: '+this._cid+' | _masterSocketsList: end '+payload.socketId);
	},
	_masterClientSlideSet: function(io, payload) {
		logger.debug('CID: '+this._cid+' | _masterClientSlideSet: start.. '+payload.socketId);
		if (!payload.socketId) throw Error('missing payloadId!');
		var socket = this.helperGetSocketById(io, '/manager', payload.socketId);
		if (!socket) throw Error(this._CID+': Error Cannot fetch socket! Client disconnected ?');
		this.helperSetClientSlide(io, socket, payload);
		if (this.helperGetSocketEndpoint(socket) != '/manager') throw Error(this._CID+': Error Invalid endpoint!');
		this.cacheRegister(io, socket);
	},
	// ok v3
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
			// assume it's a dead socket ?
			return;
		}
		logger.debug('CID: '+this._cid+' | _masterClientRegister endpoint '+socketEndpoint);
		if (socketEndpoint == '/manager') {
			var session = this.helperGetSession(socket);
			if (!this._memoryStore[session.slide.id]) this._memoryStore[session.slide.id] =  {'eventId': session.eventHash, 'type': session.slide.slideType, 'clients': [], 'data': false, 'md5': false};
			this._memoryStore[session.slide.id].clients.push(socket.id);
		}
		logger.debug('CID: '+this._cid+' | _masterClientRegister: ok '+payload.socketId);
		console.log('ok')
	},
	// ok v3
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
			this.cacheFetchManagerSlidesContent.bind(this, io),
			function(callback) { this._masterloopRunning = false; this._cacheLastFetch = Date.now(); callback(null); }.bind(this)
		], function(err) {
			if (err) {
				console.log('!!!!!!!!!!!!!!!!')
				logger.error('_masterLoop error ', err);
				logger.error('_masterLoop error ', err);
				logger.error('_masterLoop error ', err);
				this._masterloopRunning = false;
				console.log('!!!!!!!!!!!!!!!!')
			}
			// console.log('loop complete');
		}.bind(this))
	}
}