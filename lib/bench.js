/**
* Modify the parts you need to get it working.
*/

var connectionInterval = 500;
var numberOfUsersToConnect = 50;
var numberOfManagersToConnect = 1;



var assert = require('assert');
var should = require('should');
var request = require('request');
var io = require('socket.io-client');

var userServerUrl = 'http://localhost:8999/public';

var userOptions = {
	// transports: ['xhr-polling'],
	'force new connection': true,
	'query': 'token=6melbleogovitd064t88t5mj23&public=true'
};


var managerServerUrl = 'http://localhost:8999/manager';
var managerOptions = {
	// transports: ['xhr-polling'],
	'force new connection': true,
	'query': 'token=6melbleogovitd064t88t5mj23&eid=0498536e18c37f651bd6647028b331e5&t=1373754147366'
};

var testUsers = [];
var disconnected = 0;

describe("socket-io server", function () {

	var clients = [];
	var managers = [];
		disconnected = 0;

	it('Should manage 100 rapid connecting/reconnecting users', function (done) {

		this.timeout(0) // needed otherwise test fails ;)
		var connections = 0;
		var connectionTimestampSum = 0;
		for (var i = 1; i <= numberOfUsersToConnect; i++) {
			(function (index) {

				var userIndex = (index - 1) % (testUsers.length - 1);
				setTimeout(function () {

					var time = Date.now();

					var client = new SocketIoClient(userServerUrl, userOptions, {
						onConnected: function () {
							connections++;
							connectionTimestampSum += Date.now() - time;
							log((connections) + "/" + numberOfUsersToConnect + " connected! (" + (Date.now() - time )+ "ms)");
							clients.push(client);
							if (index == numberOfUsersToConnect) {
								log("Average connect time: " + Math.round(connectionTimestampSum / connections) + " ms!");
								log("");
								setTimeout(function() {
									done();
								}, 2000);
							}
						},
						onError: function() {
							console.log('CANNOT CONNECT USER '+index)
						},
						onDisconnected: function() {
							console.log('USER DISCONNECTED '+index)
							disconnected++;
						}
					});

				}, index * connectionInterval);
			})(i);
		}
	});


	it('Should handle 10 managers', function (done) {

		this.timeout(0) // needed otherwise test fails ;)
		var connections = 0;
		var connectionTimestampSum = 0;
		for (var i = 1; i <= numberOfManagersToConnect; i++) {
			(function (index) {

				var userIndex = (index - 1) % (testUsers.length - 1);
				setTimeout(function () {

					var time = Date.now();

					var manager = new SocketIoClient(managerServerUrl, managerOptions, {
						onConnected: function () {
							connections++;
							connectionTimestampSum += Date.now() - time;
							log((connections) + "/" + numberOfManagersToConnect + " connected! (" + (Date.now() - time )+ "ms)");
							managers.push(manager);
							if (index == numberOfManagersToConnect) {
								log("Average connect time: " + Math.round(connectionTimestampSum / connections) + " ms!");
								log("");
								setTimeout(function() {
									done();
								}, 2000);
							}
						},
						onError: function() {
							console.log('CANNOT CONNECT MANAGER '+index)
						},
						onDisconnected: function() {
							console.log('MANAGER DISCONNECTED '+index)
						}
					});

				}, index * connectionInterval);
			})(i);
		}
	});

	it('Should send loadSlide message from manager to all public', function (done) {
		var chosenMessenger = Math.round(Math.random() % managers.length) % managers.length,
		clientsReceived = 0,
		sentTimestamp = 0,
		receiveTimeSum = 0,
		message = "Hello other clients!",
		cl = clients.length;

		log("");
		log("Client length: " + clients.length);
		log("");

		this.timeout(0);

		// Bind event to all connected clients:
		log('clients contains '+cl+' sockets');
		for (var i = 0; i < clients.length; i++) {
			(function (index) {
				console.log('attaching event to ', index)
				var event = function (newPost) {
		
					clientsReceived++;
					receiveTimeSum += Date.now() - sentTimestamp;
		
					log("Received " + (clientsReceived) + "/" + cl + " messages!");
		
					if (clientsReceived == cl-disconnected ) {
		
						log("Average receive time: " + Math.round(receiveTimeSum / clientsReceived) + " ms!");
						log("");
		
						setTimeout(function () {
							done();
						}, 2000);
					}
				}
				clients[index].on('command', event);
			})(i);
		}

		log(' sending message..')
		var sockId = managers[chosenMessenger].socket.socket.sessionid;
		// message = {
		// 	'dispatchers': ['public', 'manager', 'display'],
		// 	'command': 'setSlide',
		// 	'commandArgs': {
		// 		'slide': {
		// 			'id': "338de54a83557c84306a87230c4c5202"
		// 		}
		// 	},
		// 	'emitter': sockId
		// };
		message = {
			'dispatchers': ['public', 'display'],
			'command': 'loadSlide',
			'commandArgs': {
				'slideId': "338de54a83557c84306a87230c4c5202"
			},
			'emitter': sockId
		};

		// Send the message from one - to all the other clients:
		sentTimestamp = Date.now();
		managers[chosenMessenger].postMessage('sendCommand', message);

	});

});

function log(message) {
	process.stdout.write("\n\t\t" + message);
}

function SocketIoClient(connectionString, options, eventObject) {
	// Establish socket connection to the node server:
	var socket = this.socket = io.connect(connectionString, options);
	
	this.eventObject = eventObject || {};
	this.eventObject.onConnected = eventObject.onConnected || function () { };
	this.eventObject.onError = eventObject.onError || function () { };
	this.eventObject.onDisconnected = eventObject.onDisconnected || function () { };
	
	
	this.socket.on('connect', function () {
		eventObject.onConnected();
	});
	
	this.socket.on('error', function (incomingError) {
		eventObject.onError(incomingError);
	});
	
	this.socket.on('disconnect', function () {
		eventObject.onDisconnected();
	});
}

SocketIoClient.prototype = {
	'disconnect': function() {
		this.socket.disconnect();
	},
	'postMessage': function(event, message) {
		this.socket.emit(event, message);
	},
	'on': function (eventType, eventCallback) {
		this.socket.on.apply(this.socket, [eventType, eventCallback]);
	}
}
