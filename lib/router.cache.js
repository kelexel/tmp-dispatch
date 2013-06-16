var prime = require('prime');
var type = require('prime/type');
var crypto = require('crypto');
var cluster = require('cluster');
var hub = require('clusterhub');

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

	// // ok V3
	// cachePurge: function(socket) {
	// 	console.log('purge start')
	// 	var session = this.helperGetSession(socket);
	// 	if (this._cachedSlides[session.eventHash] && _(this._cachedSlides[session.eventHash]).count() > 0) {
	// 		_(this._cachedSlides[session.eventHash]).each(function(slides, sid) {
	// 			if (_(slides['clients']).count() > 0) {
	// 				_(slides['clients']).each(function(sktState, sktId) {
	// 					// console.log('session.token', session.token)
	// 					// console.log('sktId', sktId)
	// 					// console.log('sid', sid)
	// 					// console.log('session.slide.id', session.slide.id)
	// 					if ((session.token == sktId) && sid != session.slide.id) {
	// 						delete this._cachedSlides[session.eventHash][sid]['clients'][sktId];
	// 						logger.debug('CID: '+this._cid+' | cachePurge cleared outdated slide ('+sid+') for socket '+socket.id);
	// 					}
	// 				}, this);
	// 			}
	// 		}, this);
	// 	}
	// 	console.log('purge stop')
	// 	logger.debug('CID: '+this._cid+' | cachePurge ok for '+socket.id);
	// },
	// // cacheEventRegister: function(io, payload) {
	// // 	if (this._cid != 99 && this._cid > 1) {
	// // 		console.log(this._cid+': skipping order!');
	// // 		return;
	// // 	}
	// // 	console.log(payload);
	// // 	return;
	// // 	var socket = this.helperGetSocketById(io, payload.socketId);
	// // 	if (!socket || !socket.handshake || !socket.handshake._Client) {
	// // 		console.log('space')
	// // 		console.log('space')
	// // 		console.log('space')
	// // 		console.log('space')
	// // 		console.log('space')
	// // 		console.log(socket)
	// // 		throw Error('die');
	// // 	}
	// // 	if (!socket) throw Error('Invalid socket!');
	// // 	return this.cacheRegister(io, socket);
	// // },

	cachePurge: function() {
		this._cacheClient.collection('cache').find({}, ['clients']).toArray(function(err, res) {
			if (err) throw err;
			var socketPull = [];
			res.forEach(function(obj) {
				console.log('found', _(obj.clients).keys())
				_(obj.clients).keys().forEach(function(key) {
					if (socketPull.indexOf(key) == '-1') socketPull.push(key);
				})
				// socketPull[obj.clients]
			})
			console.log('sokcets are')
			console.log(socketPull)
			// console.log(res);
		})
	},
	// ok v3
	cacheRegister: function(io, socket) {
		var session = this.helperGetSession(socket);
		// var cacheId = crypto.createHash('md5').update(session.eventHash+session.slide.id).digest('hex');

		// var h = false;
		 // Q.ninvoke(this._cacheClient, 'hvals', cacheId)
		 // .then(function(res) {
			// h = res.toString();
			// console.log(this._cacheClient);


			// var cacheKey = session.token;
			var cacheKey = socket.id;
			var needle = {};
			needle[cacheKey] = true;
// > db.cache.update({clients: 'M3YHPBHJd_vPaeHfaqyL'}, {$pull: {clients: 'M3YHPBHJd_vPaeHfaqyL'}}, {multi: true});
	if (!this._cacheClient) throw Error('where is my cacheClient?! '+this._cid);
 			this._cacheClient.collection('cache').update({'clients': cacheKey}, {$pull: {'clients': cacheKey}}, {multi: true}, function(err, res) {
	
	 			this._cacheClient.collection('cache').find({'eventId': session.eventHash, 'slideId': session.slide.id}).toArray(function(err, arr){
					var h = (type(arr) == 'array' && arr.length > 0) ? arr[0] : false;
					if (!h) {
						h = {'eventId': session.eventHash, 'slideId': session.slide.id, 'type': session.slide.slideType, 'clients': [], 'data': false, 'md5': false};
					}
					if (!h.clients) h.clients = [];

					h['clients'].push(cacheKey)
					// console.log('h is', h)
					this._cacheClient.collection('cache').findAndModify({'eventId': session.eventHash, 'slideId': session.slide.id}, [['_id','asc']], h, {'upsert': true, 'safe': true}, function(err, res){
						logger.debug('CID: '+this._cid+' | cacheRegister '+socket.id+' ok');
					}.bind(this));
	
				}.bind(this));
			}.bind(this));
			// return;
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
		var endpoint = this._endpoint, url, callback, propagateCallback;
		endpoint = '/manager';
		var apikey = 'ccc2855ddd41a58871bb436a484938bf';
		this._cacheClient.collection('cache').find().toArray(function(err, res) {
			if (err) throw err;
			res.forEach(function(item) {
				if (item.clients && type(item.clients) == 'array' && item.clients.length > 0 && ['cloud', 'conference'].indexOf(item.type) != '-1') {
					url = '/h/'+item.eventId+endpoint+'/embed/'+item.slideId+'?refresh=true&behaviour=all&apikey='+apikey;
					callback = function(io, eid, sid, endpoint, response) {
						propagateCallback = function(changed) {
							if (changed)
								this.cachePropagateToClients(io, eid, sid, endpoint, item.clients, response);
						}.bind(this);
						this.cacheStore(eid, sid, response, propagateCallback);
					}.bind(this, io, item.eventId, item.slideId, endpoint);
					this.backendFetchManagerSlideContent(url, callback)

				}
			}, this)
		}.bind(this))
	},
	// cacheGetCachedSlideContent: function(eid, sid) {
	// 	if (this._cachedSlides && this._cachedSlides[eid] && this._cachedSlides[eid][sid]) 
	// 		return this._cachedSlides[eid][sid].data;
	// 	else throw Error('no data for '+eid+' / '+sid+'?!');
	// },
	// cacheSendMangerSlideContent: function(socket) {
	// 	console.log('yyeyess')
	// 	console.log('yyeyess')
	// 	console.log('yyeyess')
	// 	console.log('yyeyess')
	// 	console.log('yyeyess')
	// 	console.log('yyeyess')
	// 	console.log('yyeyess')
	// 	var session = this.helperGetSession(socket);
	// 	var response = this.cacheGetCachedSlideContent(session.eventHash, session.slide.id);
	// 	console.log('repsonse')
	// 	console.log('repsonse')
	// 	console.log('repsonse')
	// 	console.log('repsonse')
	// 	console.log(response);
	// 	socket.emit('command', this.cacheToPayload(response, session.slide.id));
	// },
	cacheToPayload: function(r, sid) {
		return {'command': 'refreshComments', 'companyCallback': 'processCommand', 'commandArgs': {'timestamp': Math.floor(Date.now() / 1000), 'status': r.status, 'data': r.data, 'slideId': sid}};
	},
	cachePropagateToClients: function(io, eid, sid, endpoint, clients, response) {
		logger.debug('CID: '+this._cid+' | cachePropagateToClients start');
		if (!eid) throw Error('Invalid eid');
		if (!sid) throw Error('Invalid sid');
		if (!endpoint) throw Error('Invalid endpoint');
		if (!response) throw Error('Invalid response');
		if (clients && _(clients).count() > 0) {
			io.of(endpoint).in(eid).emit('command', this.cacheToPayload(response, sid));
		}
		logger.debug('CID: '+this._cid+' | cachePropagateToClients ok');
	},
	cacheStore: function(eid, sid, response, callback) {
		// console.log(response)
		if (!eid) throw Error('Invalid eid!');
		if (!sid) throw Error('Invalid sid!');
		if (!response) throw Error('Invalid response!');
		var newHash = crypto.createHash('md5').update(JSON.stringify(response)).digest('hex');
		this._cacheClient.collection('cache').find({'eventId': eid, 'slideId': sid}, ['md5']).toArray(function(err, res) {
			if (res.length > 1) throw Error('We have duplicate event/slide pair!');
			res = res[0];
			if (newHash != res.md5) {
				this._cacheClient.collection('cache').update({'eventId': eid, 'slideId': sid}, {$set: {'md5': newHash, 'data': response}}, {'safe': true}, function(err, res) {
					logger.debug('CID: '+this._cid+' | cacheStore '+eid+' '+sid+' ok');
					if (callback && type(callback) == 'function') callback(true);
				}.bind(this));
			} else {
				// logger.debug('CID: '+this._cid+' | cacheStore '+eid+' '+sid+' unchanged');
				if (callback && type(callback) == 'function') callback(false);
			}
		}.bind(this));
	}
};
