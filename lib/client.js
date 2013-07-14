var prime = require('prime');

module.exports = prime({
	_session: false,
	constructor: function(session) {
		this._session = session;
	},
	getSession: function(k) {
		return !k ? this._session : this._session[k];
	},
	setSessionAttr: function(k, v) {
		throw Error('DEPRECATED incomaptible with mongo storage');
		if (!this._session[k]) throw Error('Invalid session key!');
		this._session[k] = v;
	}
});