var amp		= require('../../utils/base'),
	Cookies	= require('cookies'),
	keygrip	= amp.config.cookies && Array.isArray(amp.config.cookies.keys) ? require('keygrip')(amp.config.cookies.keys) : undefined;

module.exports = amp.Component.extend({
	cookies: false,

	init: function (controller) {
		this._super.init(controller);

		this.cookies = new Cookies(controller.request, controller.response, keygrip);
	},

	get: function () {
		this.cookies.get.apply(this.cookies, arguments);
	},

	set: function () {
		this.cookies.set.apply(this.cookies, arguments);
	},

	clear: function (name) {
		this.cookies.set(name, false);
	}
});