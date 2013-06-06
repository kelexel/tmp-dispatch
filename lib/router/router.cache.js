var prime = require('prime');
var type = require('prime/type');
var crypto = require('crypto');
var cluster = require('cluster');
var hub = require('clusterhub');
var Q = require('q');

module.exports = {
// 	cacheSetup: function(io) {
// 		if (this._cid == 99 || this._cid == 1) {
// 			var callback = this.cacheEventRegister.bind(this, io);
// 			// this.helperSetEmitterEvent('newClient', callback);
// 			logger.debug('CID: '+this._cid+' | cacheSetup: ok');
// 		}
// 	},
// 	cacheAttach: function(io, socket) {
// 		var payload = {socketId: socket.id};
// 		if (this._cid == 99)
// 			this._emitter.emit('newClient', payload);
// 		else {
// 			// hub.emitLocal('newClient', payload);
// 			console.log('hub.emitRemote')
// 			console.log(payload)
// 			setTimeout(function() { console.log('emitting');hub.emitRemote('newClient', payload); }, 1000);
// // ICI !!!!!!!!!!!!!!

// 			// hub.emitRemote('newClient', payload);
// 		}

// 		if (this._endpoint == 'manager') {
// 			var callback = this.cacheSendMangerSlideContent.bind(this, socket);
// 			socket.on('getSlideContent', callback);
// 		}
// 	},

	// ok V3
	cachePurge: function(socket) {
		console.log('purge start')
		var session = this.helperGetSession(socket);
		if (this._cachedSlides[session.eventHash] && _(this._cachedSlides[session.eventHash]).count() > 0) {
			_(this._cachedSlides[session.eventHash]).each(function(slides, sid) {
				if (_(slides['clients']).count() > 0) {
					_(slides['clients']).each(function(sktState, sktId) {
						// console.log('session.token', session.token)
						// console.log('sktId', sktId)
						// console.log('sid', sid)
						// console.log('session.slide.id', session.slide.id)
						if ((session.token == sktId) && sid != session.slide.id) {
							delete this._cachedSlides[session.eventHash][sid]['clients'][sktId];
							logger.debug('CID: '+this._cid+' | cachePurge cleared outdated slide ('+sid+') for socket '+socket.id);
						}
					}, this);
				}
			}, this);
		}
		console.log('purge stop')
		logger.debug('CID: '+this._cid+' | cachePurge ok for '+socket.id);
	},
	// cacheEventRegister: function(io, payload) {
	// 	if (this._cid != 99 && this._cid > 1) {
	// 		console.log(this._cid+': skipping order!');
	// 		return;
	// 	}
	// 	console.log(payload);
	// 	return;
	// 	var socket = this.helperGetSocketById(io, payload.socketId);
	// 	if (!socket || !socket.handshake || !socket.handshake._Client) {
	// 		console.log('space')
	// 		console.log('space')
	// 		console.log('space')
	// 		console.log('space')
	// 		console.log('space')
	// 		console.log(socket)
	// 		throw Error('die');
	// 	}
	// 	if (!socket) throw Error('Invalid socket!');
	// 	return this.cacheRegister(io, socket);
	// },

	// ok v3
	cacheRegister: function(io, socket) {
		var session = this.helperGetSession(socket);
		var cacheId = crypto.createHash('md5').update(session.eventHash+session.slide.id).digest('hex');

		var h = false;
		 // Q.ninvoke(this._cacheClient, 'hvals', cacheId)
		 // .then(function(res) {
			// h = res.toString();
			var h = false;
			if (!h) h = {}
			else h = JSON.parse(h);
			this.cachePurge(socket);
			if (!h['clients']) h['clients'] = {};
			if (!h['type']) h['type'] = session.slide.slideType;
			if (!h['data']) h['data'] = false;
			if (!h['md5']) h['md5'] = false;
			h['clients'][session.token] = true;
			if (!this._cachedSlides[session.eventHash]) this._cachedSlides[session.eventHash] = {};
			this._cachedSlides[session.eventHash][session.slide.id] = h;
		// }.bind(this))
		// .then(Q.ninvoke(this._cacheClient, 'hmset', cacheId, h.clients, h.type, h.data, h.md5))
		// .then(Q.ninvoke(this._cacheClient, 'sadd', 'cacheKeys', cacheId))
		// .then(function() {
			logger.debug('CID: '+this._cid+' | cacheRegister '+socket.id+' ok');
		// }.bind(this));

// Q.fcall(this._cacheSyncSet(cacheId, h))
// .then(this._cacheSyncGet(cacheId))
// .then(function (value) {
// 	console.log('woohooooooooo', value);
// }, function (reason) {
// });
// 		// this._cacheSyncGet(cacheId);

// 		this._cachedSlides[session.eventHash][session.slide.id] = h;
// 		logger.debug('CID: '+this._cid+' | cacheRegister '+socket.id+' ok');
// 		// if (!this._cachedSlides[session.eventHash][session.slide.id].md5)
// 		// 	this.cacheFetchSlideForSocket(socket);
	},
	cacheFetchPublicSlideInfos: function(socket) {
		var session = this.helperGetSession(socket);
		var callback = this.cacheStore.bind(this, session.eventHash, session.slide.id);
		this.backendGetEventSlideInfos(socket, callback);
	},
	cacheFetchManagerSlideContent: function(io) {
		console.log('aaa')
	var deferred = Q.defer();
	return Q.ninvoke(this._cacheClient, 'smembers', 'cacheKeys').then(function(res) {
		// console.log(res)
		var cacheKeys = [];
		res.forEach(function(r) {
			var o = r.toString();
			console.log('found',o)
			deferred.ninvoke(this._cacheClient, 'hgetall', o)
			// .spread(function(res){
			// 	// console.log('kopekpokepokopekzopkop')
			// 	// deferred.resolve(res);
			// 	return;
			// })
	  //       Q.all([
			// 	Q.ninvoke(this._cacheClient, 'hget', o, 'type'),
			// 	Q.ninvoke(this._cacheClient, 'hget', o, 'clients'),
			// 	Q.ninvoke(this._cacheClient, 'hget', o, 'md5')
			// ])
			// .spread(function(res){
			// 	console.log('got');
			// 	console.log(res);
			// 	// return deferred.resolve(res);
			// });
				// return deferred.resolve(cacheKeys);
		})
		// .then(function(r) {
		// 	console.log('whooop whoop')
		// 	console.log(r)
		// 	deferred.resolve(r);
		// });
	});
	console.log('bbb')
		return
		h = res.toString();
		if (!h) h = {}
		else h = JSON.parse(h);
		this.cachePurge(socket);

		var endpoint = this._endpoint, url, callback;
		var apikey = 'ccc2855ddd41a58871bb436a484938bf';
		if (_(this._cachedSlides).count() > 0) {
			_(this._cachedSlides).each(function(slides, eid){
				if (_(slides).count() > 0) {
					_(slides).each(function(slide, sid) {
						if (_(slide['clients']).count() > 0 && ['cloud', 'conference'].indexOf(slide.type) >= 0) {
							url = '/h/'+eid+'/'+endpoint+'/embed/'+sid+'?refresh=true&behaviour=all&apikey='+apikey;
							callback = function(io, eid, sid, response) {
								var changed = this.cacheStore(eid, sid, response);
								if (changed) this.cachePropagateToClients(io, eid, sid, slide['clients'], response);
							}.bind(this, io, eid, sid);
		// var io = payload.io, socket = payload.socket, eventType = payload.eventType, eventPayload = payload.eventPayload;
							this.backendFetchManagerSlideContent(url, callback)
							// logger.info('Fetch content for slide '+sid+' '+url);
						}
					}, this);
				}
			}, this);
		}
	},
	cacheGetCachedSlideContent: function(eid, sid) {
		if (this._cachedSlides && this._cachedSlides[eid] && this._cachedSlides[eid][sid]) 
			return this._cachedSlides[eid][sid].data;
		else throw Error('no data for '+eid+' / '+sid+'?!');
	},
	cacheSendMangerSlideContent: function(socket) {
		console.log('yyeyess')
		console.log('yyeyess')
		console.log('yyeyess')
		console.log('yyeyess')
		console.log('yyeyess')
		console.log('yyeyess')
		console.log('yyeyess')
		var session = this.helperGetSession(socket);
		var response = this.cacheGetCachedSlideContent(session.eventHash, session.slide.id);
		console.log('repsonse')
		console.log('repsonse')
		console.log('repsonse')
		console.log('repsonse')
		console.log(response);
		socket.emit('command', this.cacheToPayload(response, session.slide.id));
	},
	cacheToPayload: function(r, sid) {
		return {'command': 'refreshComments', 'companyCallback': 'processCommand', 'commandArgs': {'timestamp': Math.floor(Date.now() / 1000), 'status': r.status, 'data': r.data, 'slideId': sid}};
	},
	cachePropagateToClients: function(io, eid, sid, clients, response) {
		logger.debug('CID: '+this._cid+' | cachePropagateToClients start');
		if (clients && _(clients).count() > 0) {
			io.of('/'+this._endpoint).in(eid).emit('command', this.cacheToPayload(response, sid));
		}
		logger.debug('CID: '+this._cid+' | cachePropagateToClients ok');
	},
	cacheStore: function(eid, sid, response) {
		if (!response) throw Error('Invalid response!');
		var newHash = crypto.createHash('md5').update(JSON.stringify(response)).digest('hex');
		if (this._cachedSlides[eid][sid].md5 != newHash) {
			this._cachedSlides[eid][sid].data = response;
			this._cachedSlides[eid][sid].md5 = newHash;
			logger.debug('CID: '+this._cid+' | cacheStore '+eid+' '+sid+' ok');
			return true;
		} else {
			logger.debug('CID: '+this._cid+' | cacheStore '+eid+' '+sid+' unchanged');
			return false;
		}
	},
	// _cacheSyncSet: function(cacheId, cacheData) {
	// 	// this._cacheClient.set('cacheSlides', 'foo');

	// 	console.log('storing cacheId'+cacheId)
	// this._cacheClient.hset("cache2", cacheId, JSON.stringify(cacheData), function(r) {
	// 	console.log('return', r)
	// });
	
	// // client.hset(["hash key", "hashtest 2", "some other value"]);
	// // client.hkeys("hash key", function (err, replies) {
	// //     console.log(replies.length + " replies:");
	// //     replies.forEach(function (reply, i) {
	// //         console.log("    " + i + ": " + reply);
	// //     });
	// //     client.quit();
	// // });
	// 		console.log('foo')
	// 	console.log('foo')
	// 	console.log('foo')
	// 	console.log('foo')
	// 	logger.debug('CID: '+this._cid+' | cacheStore set');
	// },
	// _cacheSyncGet: function(cacheId) {
	// 	// console.log('loading cacheId'+cacheId)
	// 	// this._cacheClient.get('cacheSlides', function(r) {console.log(r)});
	// 	// var callback = function(str) {
	// 	// 	return str;
	// 	// }
	// 	// var fields = [cacheId];
	// 	console.log('_cacheSyncGet')
	// 	this._cacheClient.hget('cache2', cacheId, function(err, res) {
	// 		return res.toString();
	// 	});
// var data = {};
// async.forEach(fields,
// 	function(item, callback) {
// 		getCacheData('cache2', item, function(err, reply){
// 			if (err) throw Error(err);
// 			console.log('received reply', reply.toString(), reply)
// 			data[item] = reply.toString();
// 			callback(null);
// 		});
// 	},
// 	function(err) {
// 		throw Error(err);
// 	}
// )
// console.log('data is')
// console.log(data);
	// 	this._cacheClient.hget("cache2", cacheId, function (err, replies) {
	// if (err) {
	// 	throw Error(err);
	// }
	//     if (replies) {
	//     	callback()
	//     }
	// });

	// },
	// _cacheSyncDebug: function() {
	// 	// this._cacheClient.get('cacheSlides', function(r) {console.log(r)});
 //   this._cacheClient.hkeys("cache2", function (err, replies) {
	// 	if (replies) {
	// 		console.log(replies.length + " replies !!!:");
	// 		replies.forEach(function (reply, i) {
	// 			console.log("    " + i + ": " + reply);
	// 		});
	// 	}
	// 	// client.quit();
	// });

	// }
};
