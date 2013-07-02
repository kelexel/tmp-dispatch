var prime = require('prime');
var type = require('prime/type');
var crypto = require('crypto');
var cluster = require('cluster');
var hub = require('clusterhub');

module.exports = {

	cachePurge: function() {
		this._cacheClient.collection('cache').find({}, ['clients']).toArray(function(err, res) {
			if (err) throw err;
			var socketPull = [];
			res.forEach(function(obj) {
				// console.log('found', _(obj.clients).keys())
				_(obj.clients).keys().forEach(function(key) {
					if (socketPull.indexOf(key) == '-1') socketPull.push(key);
				})
				// socketPull[obj.clients]
			})
			// console.log('sokcets are')
			// console.log(socketPull)
			// console.log(res);
		})
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
	cacheFetchManagerSlideContent: function(io) {
		var endpoint = this._endpoint, url, callback, propagateCallback;
		endpoint = '/manager';
		var apikey = 'ccc2855ddd41a58871bb436a484938bf';
		this._cacheClient.collection('cache').find().toArray(function(err, res) {
			if (err) throw err;
			res.forEach(function(item) {
				if (item.clients && type(item.clients) == 'array' && item.clients.length > 0 && ['cloud', 'conference', 'quiz', 'poll'].indexOf(item.type) != '-1') {
					url = '/h/'+item.eventId+endpoint+'/embed/'+item.slideId+'?refresh=true&behaviour=all&apikey='+apikey;
					callback = function(io, eid, sid, endpoint, response) {
						propagateCallback = function(changed) {
							if (changed) {
								// console.log('cache changed for '+sid)
								this.cachePropagateToClients(io, eid, sid, endpoint, item.clients, response);
							} else {
								// console.log('cache not changed for '+sid)
							}
						}.bind(this);
						this.cacheStore(eid, sid, response, propagateCallback);
					}.bind(this, io, item.eventId, item.slideId, endpoint);
					this.backendFetchManagerSlideContent(url, callback)

				}
			}, this)
		}.bind(this))
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
	cacheStore: function(eid, sid, response, callback) {
		// console.log(response)
		if (!eid) throw Error('Invalid eid!');
		if (!sid) throw Error('Invalid sid!');
		if (!response) {
				this._cacheClient.collection('cache').remove({'eventId': eid, 'slideId': sid}, function(err, res) {
					logger.warn('CID: '+this._cid+' | cacheRemove'+eid+' '+sid+' ok');
				}.bind(this));
				return;
			// throw Error('Invalid response!');
		}
		// console.log(response)
		var newHash = crypto.createHash('md5').update(JSON.stringify(response)).digest('hex');
		// console.log('newhas is '+newHash);
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
