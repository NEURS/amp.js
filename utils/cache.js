var nullCache,
	amp = require('./base');

module.exports = amp.Class.extend({
	use: false,

	init: function () {
		var cache = amp.config.cache;

		if (!cache) {
			this.use = nullCache;
		} else {
			this.use = new (require('./cachers/' . cache.type))(cache);
		}
	},

	set: function (key, value, ttl) {
		return this.use.set(key, value, ttl);
	},

	get: function (key) {
		return this.use.get(key);
	},

	del: function (key) {
		return this.use.del(key);
	},

	size: function () {
		return this.use.size();
	}
});

nullCache = {
	set: function () {},
	get: function () {},
	del: function () { return true; },
	size: function () { return 0; }
};