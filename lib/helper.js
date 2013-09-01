var cluster = require('cluster');
var hub = require('clusterhub');
var prime = require('prime');
var object = require('prime/shell/object');
var type = require('prime/type');

module.exports = {
	helperGetClusterId: function() {
		if (cluster.isWorker)
			return cluster.worker.id
		else
			return '99';
	},
	helperGetSocketEndpoint: function(socket) {
		var endpoint = this.helperGetSession(socket, 'endpoint');
		if (!endpoint) {
			throw Error('cannot get namespace!');
		}
		if (endpoint[0] != '/') endpoint = '/'+endpoint;
		return endpoint;
	},
	helperGetSession: function(socket, k) {
		if (socket && socket.handshake && socket.handshake._session) {
			return !k ? socket.handshake._session : socket.handshake._session[k];
		} else if (socket && socket._Client) {
			throw Error('this should never happen');
			return !k ? socket.getSession() : socket.getSession(k);
		}
	},
	helperGetSocketById: function(io, endpoint, sid) {
		if (!endpoint || !sid) throw Error('update call to this method!');
		// console.log(io.of(endpoint).clients())
		var target = false;
		io.of(endpoint).clients().forEach(function(socket) {
			if (socket.id == sid)
				target = socket;
		});
		return target && target.manager.connected[target.id] ? target : false;
	},
	helperGetIORooms: function(io) {
		return io.sockets.manager.rooms;
	},
	helperSetSession: function(socket, k, v) {
		if (!socket || !socket.handshake || !socket.handshake._session) throw Error('Invalid socket!');
		socket.handshake._session[k] = v;
		return;
	},
	helperGetConnectedSocketIds: function(io, endpoint) {
		var sockets = [];
		io.of(endpoint).clients().forEach(function(socket) {
			if (socket.manager.connected[socket.id]) sockets.push(socket.id);
		});
		return sockets;
	}
};