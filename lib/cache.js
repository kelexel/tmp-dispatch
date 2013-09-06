var prime = require('prime');
var object = require('prime/shell/object');
var array = require('prime/shell/array');
var type = require('prime/type');
var crypto = require('crypto');
var cluster = require('cluster');
var hub = require('clusterhub');
var async = require('async');

module.exports = {
	_cacheHashes: false,
	_cacheLastFetch: false,
	cachePurge: function(io, callback) {
		var connectedSockets = this.helperGetConnectedSocketIds(io, '/manager');
		var toTrash = [];
		if (object.count(this._memoryStore) > 0 ) {
			object.each(this._memoryStore, function(item, k) {
				if (item && item.clients && item.clients.length > 0) {
					item.clients.forEach(function(sid){
						if (connectedSockets.indexOf(sid) == '-1') array.remove(this._memoryStore[k].clients, sid);
					}, this);
				}
			}, this);
		}
		callback(null);
	},
	cacheFetchAll: function(io, parentCallback) {
		var endpoint = this._endpoint, url, callback, propagateCallback;

			async.waterfall([
				function(callback){
					if (object.count(this._memoryStore) == 0)  {
						return callback(null);
					}
					else {
						this.cacheFetchManagerSlideUrl(io, callback);
					}
				}.bind(this),
			], function(err) {
				parentCallback(null, true)
			});
	},
	cacheFetchManagerSlideUrl: function(io, parentCallback) {
		var endpoint = '/manager', url, c = 0, max = object.count(this._memoryStore);
		var apikey = 'ccc2855ddd41a58871bb436a484938bf';

		if (max == 0) {
			return parentCallback(null);
		}
		async.eachSeries(object.keys(this._memoryStore), function(key, cbEach) {
			var item = this._memoryStore[key];
			if (item.clients && type(item.clients) == 'array' && item.clients.length > 0 && ['cloud', 'conference', 'quiz', 'poll'].indexOf(item.type) != '-1') {
				url = '/h/'+item.eventId+endpoint+'/embed/'+key+'?refresh=true&behaviour=all&apikey='+apikey;
				async.waterfall([
					this.backendFetchManagerSlideContent.bind(this, url),
					function(io, eid, sid, clients, endpoint, statusCode, response, callback){
						// logger.verbose('CID: '+this._cid+' | StatusCode is "'+statusCode+'" '+url)
						if (statusCode == '200') {
							var newHash = crypto.createHash('md5').update(JSON.stringify(response)).digest('hex');

							if (this._memoryStore && this._memoryStore[sid] && this._memoryStore[sid].md5 && newHash != this._memoryStore[sid].md5) {
								this.cachePropagateToClients(io, eid, sid, endpoint, clients, response);
								this._memoryStore[sid].md5 = newHash;
								callback(null);
							} else
								callback(null);
						} else if (statusCode == '404') {
								delete this._memoryStore[sid];
								callback(null);
							return;
						} else {
							callback(null);
						}
					}.bind(this, io, item.eventId, key, item.clients, endpoint),
					function(callback) {
						c++;
						callback(null);
					}
				], function(err, res) {
					if (err) {
						parentCallback(err);
					}
					if (c == max) parentCallback(null, res);
					cbEach(null);
				});
			} else {
				parentCallback(null);
				cbEach(null);
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
		if (clients && clients.length > 0) {
			io.of(endpoint).in(eid).emit('command', this.cacheToPayload(response, sid));
		}
		logger.debug('CID: '+this._cid+' | cachePropagateToClients ok');
	}
};
