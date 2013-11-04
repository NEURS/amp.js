var store	= {},
	amp		= require('../../utils/base');

module.exports = amp.Class.extend({
	options: {
		defaultTtl: 1000 * 60 * 60 // 1 hour
	},

	init: function (options) {
		amp.extend(this.options, options);
	},

	_now: function () {
		return (new Date).getTime();
	},

	set: function (key, value, ttl, cb) {
		var timeout,
			_this = this;

		if (isNaN(ttl)) {
			ttl = this.options.defaultTtl;
		}

		if (ttl !== 0 && ttl !== Infinity) {
			timeout = setTimeout(function () {
				_this.del(key);
			}, ttl);
		} else if (ttl === 0) {
			ttl = Infinity;
		}

		store[key] = [ttl + this._now(), timeout, value];

		process.nextTick(cb);
	},

	get: function (key, cb) {
		if (key in store) {
			if (store[key][0] >= this._now()) {
				process.nextTick(function () {
					cb(null, store[key][2]);
				});
			} else {
				this.del(key, cb);
			}
		} else {
			process.nextTick(cb);
		}
	},

	del: function (key, cb) {
		if (!!store[key]) {
			clearTimeout(store[key][1]);

			store[key] = null;

			delete store[key];
		}

		process.nextTick(cb);
	},

	size: function () {
		var key,
			size = 0;

		for (key in store) {
			if (store.hasOwnProperty(key)) {
				if (this.get(key) !== null) {
					size++;
				}
			}
		}

		return size;
	}
});