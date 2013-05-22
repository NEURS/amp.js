var cache	= {},
	amp		= require('../base');

module.exports = amp.Class.extend({
	options: {
		defaultTtl: 1000 * 60 * 60 // 1 hour
	},

	init: function (options) {
		this.options = options;
	},

	_now: function () {
		return (new Date).getTime();
	}

	set: function (key, value, ttl) {
		var timeout,
			_this = this;

		if (isNaN(ttl)) {
			ttl = options.defaultTtl;
		}

		timeout = setTimeout(function () {
			_this.del(key);
		}, ttl);

		cache[key] = [ttl + this._now(), timeout, value];
	},

	get: function (key) {
		if (!!cache[key]) {
			if (cache[key][0] >= this._now()) {
				return cache[key][2];
			} else {
				this.del(key);
			}
		}

		return null;
	},

	del: function (key) {
		if (!!cache[key]) {
			clearTimeout(cache[key][1]);

			cache[key] = null;

			delete cache[key];
		}
	},

	size: function () {
		var key,
			size = 0;

		for (key in cache) {
			if (cache.hasOwnProperty(key)) {
				if (this.get(key) !== null) {
					size++;
				}
			}
		}

		return size;
	}
});