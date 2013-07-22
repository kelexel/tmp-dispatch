var prime = require('prime');
var object = require('prime/shell/object');
var type = require('prime/type');
var crypto = require('crypto');
var cluster = require('cluster');
var hub = require('clusterhub');
var async = require('async');

module.exports = {
	cachePurge: function(io, parentCallback) {
		async.waterfall([
			function(callback) {
				this._cacheClient.collection('cache').find({$where: "this.clients.length > 0"}, ['clients']).toArray(callback);
			}.bind(this),
			function(res, callback) {
				var connectedSockets = this.helperGetConnectedSocketIds(io, '/manager');
				var toTrash = [];
				res.forEach(function(obj) {
					if (obj && obj.clients && obj.clients.length > 0) {
						obj.clients.forEach(function(o){
							if (connectedSockets.indexOf(o) == '-1') toTrash.push(o);
						});
					}
				});
				callback(null, toTrash);
			}.bind(this),
			function(toTrash, callback) {
				async.each(toTrash,
					function(cacheKey, cb) {
						this._cacheClient.collection('cache').update({'clients': cacheKey}, {$pull: {'clients': cacheKey}}, {multi: true}, function(err, res) {
							cb(null, true);
						});
					},
					function(err) { 
						if (err) { 
							console.log('woops');
							callback(err);
						}
					}
				);
				callback(false, true);
			}.bind(this)
		], function(err, res) {
			if (err) {
				logger.error(err);
				logger.error(err);
				logger.error(err);
				logger.error(err);
			}
			// if (err) parentCallback(err);
			else parentCallback(null, true);
		});

		// var connectedSockets = this.helperGetConnectedSocketIds(io, '/manager');
		// this._cacheClient.collection('cache').find({}, ['clients']).toArray(function(err, res) {
		// 	if (err) parentCallback(err);
		// 	var toTrash = [];
		// 	res.forEach(function(obj) {
		// 		console.log(obj)
		// 		if (obj && obj.clients && obj.clients.length > 0) {
		// 			obj.clients.forEach(function(o){
		// 				if (connectedSockets.indexOf(o) == '-1') toTrash.push(o);
		// 			});
		// 		}
		// 	});

		// 	async.forEach(toTrash,
		// 		function(cacheKey, callback) {
		// 			this._cacheClient.collection('cache').update({'clients': cacheKey}, {$pull: {'clients': cacheKey}}, {multi: true}, callback);
		// 		},
		// 		function(err) { 
		// 			if (err) console.log('woops'); parentCallback(err); 
		// 		}
		// 	);
 	// 		// this._cacheClient.collection('cache').update({'clients': cacheKey}, {$pull: {'clients': cacheKey}}, {multi: true}, function(err, res) {

		// 	logger.debug('CID: '+this._cid+' | cachePurge contains '+toTrash.length+' sockets');
		// 	parentCallback(null, true);
		// 	// console.log('sokcets are')
		// 	// console.log(socketPull)
		// 	// console.log(res);
		// })
	},
	// ok v3
	cacheRegister: function(io, socket) {
		var session = this.helperGetSession(socket);

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

	},
	cacheFetchPublicSlideInfos: function(socket) {
		var session = this.helperGetSession(socket);
		var callback = this.cacheStore.bind(this, session.eventHash, session.slide.id);
		this.backendGetEventSlideInfos(socket, callback);
	},

	cacheFetchManagerSlidesContent: function(io, parentCallback) {
		var endpoint = this._endpoint, url, callback, propagateCallback;
		// endpoint = '/manager';
		// var apikey = 'ccc2855ddd41a58871bb436a484938bf';
		// this._cacheClient.collection('cache').find({$where: "this.clients.length > 0"}).toArray(function(err, res) {
		// 	if (err) return parentCallback(err);
		// 	if (res.length == 0) return parentCallback(null, true);

			async.waterfall([
				function(callback) {
					this._cacheClient.collection('cache').find({$where: "this.clients.length > 0"}).toArray(callback);
				},
				function(res, callback){
					if (res.length == 0) return callback(null, null);
					else this.cacheFetchManagerSlideUrl(io, res, callback);
				}.bind(this),
			], function(err, res) {
				// if (err) return parentCallback(err);
				//else
				// console.log('all done')
				parentCallback(null, true)
			})

		// 	async.series([
		// 		function(callback) {
		// 			var max = res.length, c = 0;
		// 			res.forEach(function(item) {
		// 				c++;
		// 				if (item.clients && type(item.clients) == 'array' && item.clients.length > 0 && ['cloud', 'conference', 'quiz', 'poll'].indexOf(item.type) != '-1') {
		// 					url = '/h/'+item.eventId+endpoint+'/embed/'+item.slideId+'?refresh=true&behaviour=all&apikey='+apikey;
		// 					logger.debug('CID: '+this._cid+' | cache url '+url);
		// 					cb = function(io, eid, sid, endpoint, statusCode, response) {
		// 						if (statusCode == 500)
		// 								return callback('Error 500');
		// 						propagateCallback = function(err, changed) {
		// 							if (err) return cb(err);
		// 							else if (changed) {
		// 								// console.log('cache changed for '+sid)
		// 								this.cachePropagateToClients(io, eid, sid, endpoint, item.clients, response);
		// 							} else {

		// 								// console.log('cache not changed for '+sid)
		// 							}
		// 							// console.log('c is '+c+' and max is '+max)
		// 							if (c == max) return callback(null, true);
		// 						}.bind(this);
		// 						console.log('running cacheStore');
		// 						this.cacheStore(eid, sid, url, response, propagateCallback);

		// 					}.bind(this, io, item.eventId, item.slideId, endpoint);
		// 					this.backendFetchManagerSlideContent(url, cb)
		// 				} else 
		// 					return callback(null, true);
		// 			}, this)
		// 		}.bind(this)
		// 	], function(err, res) {
		// 		// if (err) throw Error(err);
		// 		if (err)
		// 			logger.error(err);
		// 		// console.log('res is '+res);
		// 		// if (res) 
		// 			parentCallback(null, true);
		// 	});
		// }.bind(this));
	},
	cacheFetchManagerSlideUrl: function(io, res, parentCallback) {
		// console.log('working on loop')
		// console.log(res)
		var endpoint = '/manager', url, c = 0, max = res.length;

		var apikey = 'ccc2855ddd41a58871bb436a484938bf';

		// res.forEach(function(item) {
		async.eachSeries(res, function(item, cbEach) {

			if (item.clients && type(item.clients) == 'array' && item.clients.length > 0 && ['cloud', 'conference', 'quiz', 'poll'].indexOf(item.type) != '-1') {
				url = '/h/'+item.eventId+endpoint+'/embed/'+item.slideId+'?refresh=true&behaviour=all&apikey='+apikey;
				console.log('starting waterfall on '+url);
				async.waterfall([
					this.backendFetchManagerSlideContent.bind(this, url),
					function(io, eid, sid, clients, endpoint, statusCode, response, callback){
						// console.log('statusCode is "'+statusCode+'"')
						if (statusCode == '200') {
							this.cacheStore(item.eventId, item.slideId, url, response, function(err, changed) {
									if (changed)
										this.cachePropagateToClients(io, eid, sid, endpoint, clients, response);
									callback(null);
							}.bind(this));
						} else callback(null);
					}.bind(this, io, item.eventId, item.slideId, item.clients, endpoint),
					function(callback) {
						c++;
						callback(null, 'cache complete!');
					}
				], function(err, res) {
					if (err) parentCallback(err);
					// console.log(c, max);
					if (c == max) parentCallback(null, res);
					cbEach(null);
				// else parentCallback(null, res);
				});
			} else {
				parentCallback(null, true);
			}
		}.bind(this), function(err) {
			if (err) logger.error('we have an error')
		});
	},
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
	cachePurgeSlide: function(eid, sid, callback) {
		this._cacheClient.collection('cache').remove({'eventId': eid, 'slideId': sid}, function(err, res) {
			console.log('----------------------------')
			console.log('----------------------------')
			logger.warn('CID: '+this._cid+' | cacheRemove '+eid+' '+sid+' ok');
			console.log('----------------------------')
			console.log('----------------------------')
			console.log('----------------------------')
			return callback(null, false);
		}.bind(this));
	},
	cacheStore: function(eid, sid, url, response, callback) {
		// console.log(response)
		if (!eid) throw Error('Invalid eid!');
		if (!sid) throw Error('Invalid sid!');
		if (!response) {
			return this.cachePurgeSlide(eid, sid, callback);
		}
		// console.log(response)
		var newHash = crypto.createHash('md5').update(JSON.stringify(response)).digest('hex');
		// console.log('newhas is '+newHash);
		this._cacheClient.collection('cache').find({'eventId': eid, 'slideId': sid}, ['md5']).toArray(function(err, res) {
			if (res.length > 1) throw Error('We have duplicate event/slide pair!');
			res = res[0];
			if (newHash != res.md5) {
				this._cacheClient.collection('cache').update({'eventId': eid, 'slideId': sid}, {$set: {'md5': newHash, 'data': response, 'url': url}}, {'safe': true}, function(err, res) {
					logger.debug('CID: '+this._cid+' | cacheStore '+eid+' '+sid+' ok');
					if (callback && type(callback) == 'function') callback(null, true);
				}.bind(this));
			} else {
				// logger.debug('CID: '+this._cid+' | cacheStore '+eid+' '+sid+' unchanged');
				if (callback && type(callback) == 'function') callback(null, false);
			}
		}.bind(this));
	}
};
