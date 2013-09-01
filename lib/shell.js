var prime = require('prime');
var type = require('prime/type');
var object = require('prime/shell/object');
module.exports = {
	shellSetup: function(io) {
		if (!this._isMaster) {
			logger.info('CID: '+this._cid+' | shellSetup: but not master!!');
			return;
		}
		logger.debug('CID: '+this._cid+' | shellSetup: emitter ok');
	},
	shellAttach: function(io, socket) {
		if (this.helperGetSocketEndpoint(socket) != '/shell') {
			throw Error('why attach shell if endpoint is not /shell ?!');
		}
		var callback = this._shellEventEmitterListener.bind(this, io, socket);
		socket.on('shellQuery', callback);
		logger.debug('CID: '+this._cid+' | shellSetup: socket ok');
	},

	_shellEventEmitterListener: function(io, socket, eventPayload) {
		if (!io) throw Error('Missing IO');
		if (!eventPayload) {
			throw Error('Invalid payload ');
		}
		switch(eventPayload.cmd) {
			case 'listRooms':
				var rooms = this.helperGetIORooms(io);
				rooms = object.keys(rooms);
				var res = [];
				rooms.forEach(function(room) {
					if (room.split('/').length > 2)
						res.push(room);
				})
				socket.emit('shellResponse', {'status': 'ok', 'buffer':  {'cid': this._cid, 'dispatcher': this._endpoint, 'response': res.valueOf()}});
			break;
			case 'listSockets':
				this.eventsInternalPropagate('Master', 'listSockets', {'socketId': socket.id, 'room': eventPayload.args.target});
			break;
			case 'listCache':
				this.eventsInternalPropagate('Master', 'listCache', {'socketId': socket.id});
			break;
			case 'listPollings':
				socket.emit('shellResponse', {'status': 'ok', 'buffer':  {'cid': this._cid, 'response': this._polling.valueOf()}});
			break;
			case 'refreshPage':
				this.frontendPropagateToUI(io, eventPayload.args);
				socket.emit('shellResponse', {'status': 'ok', 'buffer':  {'cid': this._cid, 'response': {'status': 'ok'}}});
			break;
			default:
				logger.error('CID: '+this._cid+' Unknown shell command ', eventPayload.cmd);
			break;
		}
	},
	_shellSocketsList: function(io, payload) {
		logger.verbose('CID: '+this._cid+' | _masterSocketsList: start.. '+payload.socketId);
		var data = {}, rooms = this.helperGetIORooms(io), target = payload.room, r;
		object.each(rooms, function(sockets, rid){
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
	}
};