var amp = require('../../utils/base');

module.exports = amp.Class.extend({
	controller: null,

	init: function (controller) {
		this.controller = controller;
	},

	_init: function (cb) {
		cb && cb();
	}
});