var amp		= require('../../utils/base'),
	store	= amp.stores[amp.config.session.store];

module.exports = amp.Class.extend({
	id: null,
	session: null,

	init: function (request, data) {
		this.id			= request.session_id;
		this.session	= request.session;
	},

	flash: function (type) {
		var message;

		if (!this.session || !this.session._flash) {
			return undefined;
		}

		type	= type || 'general';
		message	= this.session._flash[type];

		delete this.session._flash[type];

		store.set(amp.config.session.cookie.name + this.id, this.session, 0);

		return message;
	}
});