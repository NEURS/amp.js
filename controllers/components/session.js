var amp		= require('../../utils/base'),
	crypto	= require('crypto'),
	dottie	= require('dottie'),
	cookies	= require('./cookies'),
	config	= amp.config.session,
	store	= amp.stores[config.store] || new (require('../../lib/stores/' + config.store))(config),
	noop	= function () {};

if (!amp.stores[config.store]) {
	amp.stores[config.store] = store;
}

module.exports = amp.Component.extend({
	_id: null,
	session: null,
	cookies: null,

	_init: function (cb) {
		this.session	= {};
		this.cookies	= this.controller.Cookies || new cookies(this.controller);

		if (this.controller.request.session) {
			this.session = this.controller.request.session;

			this._setCookie();

			cb();
		} else {
			store.get(config.cookie.name + this.id, function (err, result) {
				if (result) {
					this.session = this.controller.request.session = result;
				}

				this._setCookie();

				cb();
			}.bind(this));
		}

		this.controller.request.session_id = this.id;
	},

	_setCookie: function () {
		this.cookies.set(config.cookie.name, this.id, config.cookie);
	},

	destroy: function (cb) {
		store.del(config.cookie.name + this.id, function () {
			this.session	= this.controller.request.session = {};
			this._id		= this._create(); // generate new id

			this.cookies.set(config.cookie.name, this.id, config.cookie);

			cb();
		}.bind(this));
	},

	get id() {
		if (!this._id) {
			this._id = this.cookies.get(config.cookie.name) || this._create();
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

	get: function (key, cb) {
		if (!cb) {
			return dottie.get(this.session, key);
		}

		store.get(config.cookie.name + this.id, function (err, result) {
			if (err) {

			} else {
				cb(null, dottie.get(result, key));
			}
		});
	},

	set: function (key, value, cb) {
		dottie.set(this.session, key, value);

		this.controller.request.session = this.session;

		store.set(config.cookie.name + this.id, this.session, config.ttl || 172800, cb || noop);
	},

	del: function (key, cb) {
		dottie.set(this.session, key, undefined);

		store.del(key, cb || noop);
	},

	flash: function (type, message, cb) {
		if (!message) {
			message	= type;
			type	= 'general';
		}

		this.set('_flash.' + type, message, cb || noop);
	}
});
