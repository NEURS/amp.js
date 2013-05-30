var amp		= require('../../utils/base'),
	store	= amp.stores[amp.config.session.store];

module.exports = amp.Class.extend({
	session: null,

	init: function (request, data) {
		this.session = request.session;
	},

	flash: function (type) {
		var message;

		if (!this.session || !this.session._flash) {
			return undefined;
		}

		type	= type || 'general';
		message	= this.session._flash[type];

		delete this.session._flash[type];

		return message;
	}
});