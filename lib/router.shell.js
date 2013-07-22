var prime = require('prime');
var type = require('prime/type');
// var emitter = new (require('prime/emitter'));
var object = require('prime/shell/object');
module.exports = {
	shellSetup: function(io) {
		if (!this._isMaster) {
			logger.error('CID: '+this._cid+' | shellSetup: but not master!!');
			return;
		}
		// var callback = this._shellEventEmitterListener.bind(this, io);
		// this.helperSetEmitterEvent('Shell', callback);
		logger.debug('CID: '+this._cid+' | shellSetup: emitter ok');
	},
	shellAttach: function(io, socket) {
		// if (!this._isMaster) {
		// 	logger.error('CID: '+this._cid+' | masterSetup: but not master!!');
		// 	return;
		// }

		if (this.helperGetSocketEndpoint(socket) != '/shell') {
			throw Error('why attach shell if endpoint is not /shell ?!');
		}
		var callback = this._shellEventEmitterListener.bind(this, io, socket);
		socket.on('shellQuery', callback);
		logger.debug('CID: '+this._cid+' | shellSetup: socket ok');
	},
	// _shellEventSocketListener: function(io, socket, payload){
	// 	logger.verbose('CID: '+this._cid+' | Received shell payload:'+ payload.toString());
	// 	if (!payload.dispatchers) payload.dispatchers = ['manager'];
	// 	// this.eventPropagateToDispatchers(io, socket, 'shell', payload);
	// 	payload.socket = socket;
	// 	this.helperPropagateViaEmitter(io, socket, 'shell', payload);
	// },

	_shellEventEmitterListener: function(io, socket, eventPayload) {
		if (!io) throw Error('Missing IO');
		if (!eventPayload) {
			throw Error('Invalid payload ');
		}
		// socket = payload.eventPayload.socket;
		switch(eventPayload.cmd) {
			case 'listRooms':
				var rooms = this.helperGetDispatcherRooms(io);
				rooms = _(rooms).keys();
				socket.emit('shellResponse', {'status': 'ok', 'buffer':  {'cid': this._cid, 'dispatcher': this._endpoint, 'response': rooms.valueOf()}});
			break;
			case 'listSockets':
				var endpoint = this.helperGetSocketEndpoint(socket);
				var sockets, rooms = this.helperGetDispatcherRooms(io);

				var data = rooms;
				// sockets = {};
				// object.each(rooms, function(room, rid){
				// 	sockets.rid = {}
				// });
				// // if (rooms['/'+endpoint+'/'+eventPayload.args.target])
				// // 	sockets =rooms['/'+endpoint+'/'+eventPayload.args.target];
				// var data = {};
				var s;
				if (sockets && type(sockets) == 'array' && sockets.length > 0) {
					console.log(sockets)
					sockets.forEach(function(sid) {
						s = this.helperGetSocketById(io, '/shell', sid)
						data[s.id] = s.handshake._session;
					}, this);
				}
				socket.emit('shellResponse', {'status': 'ok', 'buffer': {'cid': this._cid, 'response': data.valueOf()}});
			break;
			case 'listCache':
				this.helperPropagateEmitterEvent('master', 'listCache', {'socketId': socket.id});
			// var response = this._cachedSlides.valueOf();
			// console.log(response)
			break;
			case 'listPollings':
				socket.emit('shellResponse', {'status': 'ok', 'buffer':  {'cid': this._cid, 'response': this._polling.valueOf()}});
			break;
			default:
				logger.error('CID: '+this._cid+' Unknown shell command ', eventPayload.cmd);
			break;
		}
	}
};