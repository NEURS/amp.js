var amp = require('amp');

module.exports = amp.Class.extend({
    /* Connection Settings */
    _settings: {},

    init: function (options) {
		this._settings = options;
	},

	connect: function () { return true; },
	close: function () { return true; }
});