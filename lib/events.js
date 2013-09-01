var prime = require('prime');
var type = require('prime/type');

module.exports = {
	eventsInternalSetup: function(event, fn) {
		if (this._cid == 99)
			this._emitter.on(event, fn);
		else
			hub.on(event, fn);
	},
	eventsInternalPropagate: function(event, eventType, eventPayload) {
		var payload = {'eventType': eventType, 'eventPayload': eventPayload, 'eventWorker': this._cid};
		if (this._cid == 99) {
			this._emitter.emit(event, payload);
		} else if (this._cid != 99) {
			hub.emitLocal(event, payload);
			hub.emitRemote(event, payload);
		} else
			throw Error('This should not happen!');
	}
}