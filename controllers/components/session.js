var amp		= require('../../utils/base'),
	crypto	= require('crypto'),
	dottie	= require('dottie'),
	config	= amp.config.session,
	store	= new (require('../../lib/stores/' . config.store))(config);

module.exports = amp.Component.extend({
	_id: null,
	session: null,
	cookies: null,

	init: function (controller) {
		this._super.init(controller);

		this.cookies = controller.Cookies || new (require('./cookies'))(controller);
		this.session = store.get(this.id); // initialize session
	},

	get id() {
		if (!this._id) {
			this._id = this.cookies.get('SID') || this._create();
		}

		return this._id;
	},

	_create: function () {
		return crypto
			.randomBytes(64)
			.toString('base64')
			.replace(/\/|\+|=/g, function(x) {
				return ({ '/': '_', '+': '-', '=': '' })[x]
			});
	},

	get: function (key) {
		return dottie.get(this.session, key);
	}

	set: function (key, value) {
		this.session = dottie.set(this.session, key, value);

		store.set(this._id, this.session, 0);
	},

	del: function (key) {
		this.set(key, undefined);
	},

	flash: function (type, message) {
		if (!message) {
			message	= type;
			type	= 'general';
		}

		this.set('_flash.' . type, message);
	}
});