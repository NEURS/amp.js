var amp = require('../../utils/base');

module.exports = amp.Class.extend({
	controller: null,

	_init: function (controller) {
		this.controller = controller;
	}
});