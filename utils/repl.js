var amp		= require('../utils/base'),
	net		= require('net'),
	repl	= require('repl');

var ar = module.exports = {
	_server: null,
	_sockets: [],

	actions: [],

	/**
	 * start(port[, host]);
	 * start(path)
	 */
	start: function () {
		var _this = this;

		if (this._server) {
			return;
		}

		this._server = net.createServer(function (socket) {
			var context;

			context		= repl.start('amp.js - cluster > ', socket).context;
			sock.title	= function (str) { this.write('\n  \033[36m' + str + '\033[0m\n'); }
			sock.row	= function (key, val) { this.write('  \033[90m' + key + ':\033[0m ' + val + '\n'); }

			_this._sockets.push(socket);

			Object.keys(_this.actions).forEach(function (action) {
				context[action] = _this.actions[action].bind(socket);
			});
		});

		this._server.listen.apply(this._server, arguments);

		return this;
	},

	define: function (name, action, help) {
		this.actions[name]		= action;
		this.actions[name].help	= help;

		return this;
	}
};

ar.define('help', function () {
	this.title('Commands');

	Object.keys(ar.actions).forEach(function (action) {
		params = ar.actions[action].toString().match(/^function +\((.*?)\)/)[1];

		this.row(cmd + '(' + params + ')', ar.actions[action].help);
	}, this);

	this.write('\n');
}, 'Display help information');