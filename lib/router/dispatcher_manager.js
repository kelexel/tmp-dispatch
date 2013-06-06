var prime = require('prime');
var Dispatcher = require('./dispatcher.js');
var crypto = require('crypto');
var object = require('prime/shell/object');
var array = require('prime/shell/array');
var type = require('prime/type');

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
		var cached = this.cacheGet(slide.id);
		// if (cached) setTimeout(1000, this.cachePropagateToOne.bind(this, socket, slide.id, cached));
	},

	socketAttachEvents: function(server, io, socket) {
		socket.on('setSlideOption', this.socketSetOptionsListener.bind(this, server, io, socket));
		socket.on('sendCommand', this.socketSendCommandListener.bind(this, server, io, socket));
		socket.on('reconnect', function(){console.log('recooooooooooooooooo')});
	},
	sessionUpdateSlide: function(io, socket, payload) {
		console.log('update slide !!!!!')
		console.log('update slide !!!!!')
		console.log('update slide !!!!!')
		console.log('update slide !!!!!')
		console.log('update slide !!!!!')
		logger.debug('CID: '+this._getClusterId()+' sessionUpdateSlide for', socket.id);
		if (payload.commandArgs.slide) {
			logger.debug('CID: '+this._getClusterId()+' updating current socket slide');
			// socket.handshake._session.slide = payload.commandArgs.slide;
			this._polling[payload.commandArgs.slide.id] = true;
		}
	},
	getSlideFromSocket: function(socket) {
		return socket.handshake._session.slide;
	},
	periodicalPoll: function(io) {
		// return;
		var rooms = this._getDispatcherRooms(io);
		var slides = [];
		object.each(rooms, function(sockets, room) {
			if (room == '' ||room == '/'+this._dispatcherTyper) return;
			// if (room == '' ||room == '/'+this._dispatcherTyper || room.test('/'+this._dispatcherTyper+'/')) return;
//			logger.debug('there are '+sockets.length+' sockets')
			array.forEach(sockets, function(sid){
				// var socket = io.sockets.sockets[sid];
				var socket = this._getSocketFromSid(io, sid);
				if (!socket || !socket.handshake || !socket.handshake._session) return; 
				var slide = this.getSlideFromSocket(socket);
//				logger.debug('found slide '+slide.id+' for socket '+socket.id);
				if (!slide.id) throw Error('missing slide id ?!');
				if (!slide.slideType) throw Error('missing slide type ?!');
				if (array.indexOf(slides, slide.id) >= 0) {
//					logger.debug('skipping slide '+slide.id+' for socket '+sid+' in room '+room+' (slide already in the loop)');
					return;
				}
				slides.push(slide.id)
				logger.debug('CID: '+this._getClusterId()+' found slide id '+slide.id+' for socket '+sid+' in room '+room);
				var session = socket.handshake._session;
				var url = '/h/'+session.eventHash+'/'+this._dispatcherTyper+'/embed/'+session.slide.id+'?refresh=true&behaviour=all';
				this.processPoll(io, socket, session.slide, url);
			}, this);

		}, this);
		if (slides.length > 0 && _(this._polling).count() > 0) {
			object.each(this._polling, function(att, slideId){
				// console.log(type(slides), array.indexOf(slides, slideId));
				if (array.indexOf(slides, slideId) == -1) {
					logger.debug('CID: '+this._getClusterId()+' clearing cache for slide', slideId);
					delete this._polling[slideId];
				}
			}, this);
		}
		return;
	},

	cacheHasChanged: function(sid, md5) {
		return this._polling[sid] && this._polling[sid].hash == md5 ? false : true;
	},
	cacheSlide: function(url, slide, md5, data) {
		this._polling[slide.id] = {'url': url, 'slide': slide, 'hash' : md5, 'data': data};
		return this;
	},
	cacheGet: function(sid) {
		return this._polling[sid] ? this._polling[sid].data : false;
	},
	cachePropagateToAll: function(io, session, sid, r) {
		io.of('/'+this._dispatcherTyper).in(session.eventHash).emit('command', this.cacheToPayload(sid, r));
		return this;
	},
	cachePropagateToOne: function(socket, sid, r) {
		socket.emit('command', this.cacheToPayload(sid, r));
		return this;
	},
	cacheToPayload: function(sid, r) {
		return {'command': 'refreshComments', 'companyCallback': 'processCommand', 'commandArgs': {'timestamp': Math.floor(Date.now() / 1000), 'status': r.status, 'data': r.data, 'slideId': sid}};
	},

	processPoll: function(io, socket, slide, url) {
		// if (this._pollLoop) clearTimeout(this._pollLoop);
		var session = socket.handshake._session;
		if (!session.slide.id) throw Error('missing slide id ?!');
		if (!session.slide.slideType) throw Error('missing slide type ?!');
		// if (!session) throw Error('no session!');
		switch(slide.slideType) {
			case 'conference':
			case 'cloud':
				var fn = function(code, r) {
					if (code != 200) throw Error('Cannot talk to backend!');
					var md5 = crypto.createHash('md5').update(JSON.stringify(r.data)).digest('hex');

					if (!this.cacheHasChanged(slide.id, md5)) {
						// logger.debug('skipping polling emitter (cached) for slide '+slide.id+' ('+slide.slideType+')');
						return this; 
					}

					this.cacheSlide(url, slide, md5, r).cachePropagateToAll(io, session, slide.id, r);

				}.bind(this);
				// logger.debug('starting slide polling for slide '+slide.id+' ('+slide.slideType+')');
				// try {
				// 	// console.log('poll '+session.slide.id);
				// 	this.pollContent(session, url, 'manager', fn);
				// } catch(e) {
				// 	console.log('DELETEING NON EXISTING SLIDE IN SOCKET');
				// 	delete socket.handshake._session.slide;
				// }
			break;
			default:
				// logger.debug('slide '+slide.id+' ('+slide.slideType+') has no polling');
				delete this._polling[slide.id];
			break;
		}
		return this;
	}
});