// var socketStore = new (require('socket.io-clusterhub'))
	// , redis = require('redis')
var prime = require('prime')
	, _env = require(__dirname+'/../etc/env.js')
	, ioRedis  = require('socket.io/node_modules/redis')
	, RedisStore = require('socket.io/lib/stores/redis')
		, redisPub = ioRedis.createClient(_env.get('redisPort').toString(), _env.get('redisIP').toString(), null)
		, redisSub = ioRedis.createClient(_env.get('redisPort').toString(), _env.get('redisIP').toString(), null)
		, redisClient = ioRedis.createClient(_env.get('redisPort').toString(), _env.get('redisIP').toString(), null);
		redisPub.on('error', function(err){console.error(err)});
		redisSub.on('error', function(err){console.error(err)});
		redisClient.on('error', function(err){console.error(err);});

module.exports = {
	ioSetup: function(io) {
		var cid = this._cid;
		this._options = {};

		// global conf
		io.configure(function() {
			io.enable('browser client etag');          // apply etag caching logic based on version number
			io.enable('browser client gzip');          // gzip the file	
			//, 'sync disconnect on unload': true
			// io.set('store', store);
			io.set('store', new RedisStore({
				'log level': 3,
				redisPub: redisPub,
				redisSub: redisSub,
				redisClient: redisClient
			}));
		});

		// prod conf
		io.configure('prod', function () { 
			logger.info('CID: '+cid+' | Starting in production mode');
			io.enable('browser client minification');
			io.enable('browser client gzip');          // gzip the file	
			// io.set('log level', 1);
			io.enable('browser client etag');
			// io.set('transports', ['websocket']);
		});


		// dev conf
		io.configure('dev', function(){
			logger.info('CID: '+cid+' | Starting in developmment mode');
			io.set('log level', 1);
			io.set('max reconnection attempts','999999999');
			// io.set('transports', ['websocket']);
		});

		var auth = new (require(__dirname+'/auth.js'))(this._cid, this._endpoint), readySocket = this._readySocket.bind(this, io);

		// var endpoints = this._isMaster ? this._endpoints.master : this._endpoints.workers;
		// if (!this._isMaster && this._cid != 99) {
			var endpoints = this._endpoints.workers;
			endpoints.forEach(function(endpoint) {
				logger.info('CID: '+cid+' | Configuring endpoint: /'+endpoint)
				io.of('/'+endpoint)
					.authorization(function(data, callback) {
						auth.challenge(endpoint, data, callback);
					})
					.on('connection', readySocket)
					.on('disconnect', function(socket) { console.log('disconnected 1'); console.log(socket);})
					.on('disconnection', function(socket) { console.log('disconnected 2'); console.log(socket);})
					.on('disconnected', function(socket) { console.log('disconnected 3'); console.log(socket);})

			});
		// }
	}
};