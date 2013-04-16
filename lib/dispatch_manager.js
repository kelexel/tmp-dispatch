var prime = require('prime');
var Dispatcher = require('./dispatcher.js');
var crypto = require('crypto');
var object = require('prime/shell/object');
var array = require('prime/shell/array');

module.exports = prime({
	inherits: Dispatcher,
	_dispatcherTyper: 'manager',
	constructor: function(io, server) {
		Dispatcher.call(this, io, server);
		this._options.pollDelay = 1250;
		setInterval(this.periodicalPoll.bind(this, io), this._options.pollDelay);
	},

socketOnConnect: function(server, io, socket) {
	Dispatcher.prototype.socketOnConnect.call(this, server, io, socket);
	var slide = this.getSlideFromSocket(socket);
	if (!slide || !slide.id || !slide.slideType) throw Error('Invalid slide');
	var md5 = this.cacheGlobalPollGet(socket, slide.id);
	if (!md5) throw Error('Invalid hash');
	this.cacheClientPollRevisionsSet(socket, slide.id)
	this.cacheClientPropagate(socket, slide.id, md5);
},

	socketAttachEvents: function(server, io, socket) {
		socket.on('setSlideOption', this.socketSetOptionsListener.bind(this, server, io, socket));
		socket.on('sendCommand', this.socketSendCommandListener.bind(this, server, io, socket));
		socket.on('reconnect', function(){console.log('recooooooooooooooooo')});
	},
	sessionUpdateSlide: function(io, socket, payload) {
		// logger.debug('sessionUpdateSlide for', socket.id);
		if (payload.commandArgs.slide) {
			logger.debug('updating current socket slide');
			if (this._polling[socket.handshake._session.slide.id]) delete this._polling[socket.handshake._session.slide.id];
			socket.handshake._session.slide = payload.commandArgs.slide;
			this._polling[payload.commandArgs.slide.id] = true;
			this.pollNewContent(io, socket, payload.commandArgs.slide);
		}
	},
	getSlideFromSocket: function(socket) {
		return socket.handshake._session.slide;
	},
	periodicalPoll: function(io) {
		var rooms = io.sockets.manager.rooms;
		var slides = [];
		object.each(rooms, function(sockets, room) {
			if (room == '' ||room == '/'+this._dispatcherTyper) return;
			array.forEach(sockets, function(sid){
				var socket = io.sockets.sockets[sid];
				if (!socket || !socket.handshake || !socket.handshake._session) return; 
				var slide = this.getSlideFromSocket(socket);
				if (!slide.id) throw Error('missing slide id ?!');
				if (!slide.slideType) throw Error('missing slide type ?!');
				if (array.indexOf(slides, slide.id) == 0) {
//					logger.debug('skipping slide '+slide.id+' for socket '+sid+' in room '+room+' (slide already in the loop)');
					return;
				}
				slides.push(socket.handshake._session.slide.id)
//				logger.debug('found slide id '+slide.id+' for socket '+sid+' in room '+room);
				this.processPoll(io, socket, socket.handshake._session.slide);
			}, this);

		}, this);
return;




		// if (!socket || !socket.handshake || !socket.handshake._session) {
		// 	logger.debug('cleaning dead socket');
		// 	return;
		// }
		// if (!slide || !slide.id || !slide.slideType) throw Error('Invalid slide!');
		// var session = socket.handshake._session;
		// if (!session) throw Error('no session!');
		// if (this._polling[slide.id]) {
		// 	logger.debug('slide '+slide.id+' ('+slide.slideType+') is already running!');
		// 	return;
		// }
	},
	cacheGlobalPollGet: function(sid, md5) {
		return this._polling[sid] && this._polling[sid].hash == 'md5' ? true : false;
	},
	cacheGlobalPollRevisionsCheck: function(sid, md5) {
		return md5 == this._polling[sid] ? true : false;
	},
	cacheGlobalPollStore: function(sid, md5, r) {
		this._polling[sid] = {'hash': md5, 'data': r};
		return this;
	},
	cacheGlobalPropagate: function(io, session, sid, md5, r) {
		var payload = {'command': 'refreshComments', 'companyCallback': 'processCommand', 'commandArgs': {'status': r.status, 'data': r.data, 'slideId': sid}};
		this.cacheGlobalPollStore(sid, md5, r);
		io.of('/'+this._dispatcherTyper).in(session.eventHash).emit('command', payload);
		return this;
	},
	cacheClientPollRevisionsGet: function(socket, sid) {
		console.log('want '+sid, socket.cache.pollRevision)
		return socket.cache && socket.cache.pollRevisions && socket.cache.pollRevision[sid] ? socket.cache.pollRevision[sid] : false;
	},
	// cacheClientPollRevisionsCheck: function(socket, sid, md5) {
	// 	return socket.cache && socket.cache.pollRevisions && socket.cache.pollRevision[sid] && socket.cache.pollRevision[sid] == md5 ? socket.cache.pollRevision[sid] : false;
	// },
	cacheClientPollRevisionsSet: function(socket, sid, md5) {
		if (!socket.cache) socket.cache = {};
		if (!socket.cache.pollRevisions) socket.cache.pollRevisions = {};
		socket.cache.pollRevisions[sid] = md5
		return this;
	},
	cacheClientPropagate: function (socket, sid, md5) {
		r = this.cacheGlobalPollGet(sid, md5);
		if (!r) throw Error('Cannot cacheClientPropagate');
		var payload = {'command': 'refreshComments', 'companyCallback': 'processCommand', 'commandArgs': {'status': r.status, 'data': r.data, 'slideId': sid}};
		this.cacheGlobalPollRevisionsSet(sid, md5);
		socket.emit('command', payload);
		return this;
	},
	processPoll: function(io, socket, slide) {
		// if (this._pollLoop) clearTimeout(this._pollLoop);
		var session = socket.handshake._session;
			if (!session.slide.id) throw Error('missing slide id ?!');
			if (!session.slide.slideType) throw Error('missing slide type ?!');
		// if (!session) throw Error('no session!');
		switch(slide.slideType) {
			case 'conference':
				var fn = function(code, r) {
					if (code != 200) throw Error('Cannot talk to backend!');
					var md5 = crypto.createHash('md5').update(JSON.stringify(r.data)).digest('hex');
					if (this.cacheGlobalPollRevisionsCheck(slide.id, md5)) {
						logger.debug('skipping polling emitter (cached) for slide '+slide.id+' ('+slide.slideType+')');
						// if (!this.cacheClientPollRevisionsCheck(socket, slide.id, md5))
						// 	this.cacheClientPollRevisionsSet(socket, slide.id, md5).cacheClientPropagate(socket, slide.id, md5)
						return this; 
					}
					this.cacheClientPollRevisionsSet(socket, slide.id, md5).cacheGlobalPropagate(io, session, slide.id, md5, r);
				}.bind(this);
				logger.debug('starting slide polling for slide '+slide.id+' ('+slide.slideType+')');
				this.pollContent(session, 'manager', fn);
			break;
			default:
				logger.debug('slide '+slide.id+' ('+slide.slideType+') has no polling');
				delete this._polling[slide.id];
			break;
		}
		return this;
	},
	// pollNewContent: function(io, socket, slide) {
	// 	if (!socket || !socket.handshake || !socket.handshake._session) {
	// 		logger.debug('cleaning dead socket');
	// 		return;
	// 	}
	// 	if (!slide || !slide.id || !slide.slideType) throw Error('Invalid slide!');
	// 	var session = socket.handshake._session;
	// 	if (!session) throw Error('no session!');
	// 	if (this._polling[slide.id]) {
	// 		logger.debug('slide '+slide.id+' ('+slide.slideType+') is already running!');
	// 		return;
	// 	}
	// 	// if (this._pollLoop) clearTimeout(this._pollLoop);
	// 	switch(slide.slideType) {
	// 		case 'conference':
	// 			var fn = function(code, r) {
	// 				if (code != 200) throw Error('Cannot talk to backend!');
	// 				var md5 = crypto.createHash('md5').update(JSON.stringify(r.data)).digest('hex');
	// 				console.log(md5)
	// 				if (md5 == this._polling[slide.id]) {
	// 					logger.debug('skipping polling emitter (cached) for slide '+slide.id+' ('+slide.slideType+')');
	// 					setTimeout(this.pollNewContent.bind(this, io, socket, slide), this._options.pollDelay);
	// 					return; 
	// 				}
	// 				this._polling[slide.id] = md5;
	// 				var payload = {'command': 'refreshComments', 'companyCallback': 'processCommand', 'commandArgs': {'status': r.status, 'data': r.data, 'slideId': slide.id}};
	// 				io.of('/'+this._dispatcherTyper).in(session.eventHash).emit('command', payload);
	// 				// delete this._polling[session.slide.id];
	// 				// this._pollLoop = setTimeout(this.pollNewContent.bind(this,io, socket), 3000);
	// 				setTimeout(this.pollNewContent.bind(this, io, socket, slide), this._options.pollDelay);
	// 			}.bind(this);
	// 			logger.debug('starting slide polling for slide '+slide.id+' ('+slide.slideType+')');
	// 			this.pollContent(session, 'manager', fn);
	// 		break;
	// 		default:
	// 			logger.debug('slide '+slide.id+' ('+slide.slideType+') has no polling');
	// 			delete this._polling[slide.id];
	// 		break;
	// 	}
	// },


});