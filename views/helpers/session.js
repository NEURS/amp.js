var amp = require('amp');

module.exports = amp.Class.extend({
	session: null,

	init: function (request, data) {
		this.session = request.session;
	},

	flash: function (type) {
		var message;

		type	= type || 'general';
		message	= this.session._flash[type];

		delete this.session._flash[type];

		return message;
	}
});