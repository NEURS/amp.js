var store,
	amp		= require('../../utils/base'),
	redis	= require('redis');

module.exports = amp.Class.extend({
	options: {
		defaultTtl: 1000 * 60 * 60 // 1 hour
	},

	init: function (options) {
		amp.extend(this.options, options);

		store = redis.createClient(this.options.redis.port, this.options.redis.host, this.options.redis.options);
	},

	set: function (key, value, ttl, cb) {
		var timeout,
			_this = this;

		value = JSON.stringify(value);

		if (isNaN(ttl)) {
			ttl = this.options.defaultTtl;
		}

		if (ttl !== 0 && ttl !== Infinity) {
			store.setex(key, ttl, value, cb);
		} else {
			store.set(key, value, cb);
		}
	},

	get: function (key, cb) {
		store.get(key, function (err, result) {
			if (err || !result) {
				cb(err);
			} else {
				cb(null, JSON.parse(result));
			}
		});
	},

	del: function (key, cb) {
		store.del(key, cb);
	},

	size: function () {
		return 0;
	}
});