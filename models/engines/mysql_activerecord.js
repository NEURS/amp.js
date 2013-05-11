var amp = require('amp');

module.exports = amp.Models.Engines.Engine.extend({
	_engine: require("mysql-activerecord"),
	_connection: null,

	connect: function () {
        var i;

		this._connection = new this._engine.Adaptor(options);

		if (!this._connection) {
			amp.error(503, "Connection Unsuccessful");
		}

		for (i in this._connection) {
			if (typeof this._connection[i] === "function") {
				this[i] = function () {
					// Make sure the connection hasn't closed...
					if (!!this._connection) {
						return this._connection[i].apply(this._connection, arguments);
					}
				};
			}
		}

		return true;
	},

	close: function () {
		return this._connection.disconnect() || this._connection.forceDisconnect();
	}
});