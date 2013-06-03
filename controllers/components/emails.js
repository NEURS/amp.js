var amp		= require('amp.js'),
	fs		= require('fs'),
	dottie	= require('dottie'),
	valid	= ['postmark'],
	options	= amp.config.email;

module.exports = amp.Component.extend({
	options: null,
	use: null,

	_queue: [],
	_data: {},
	_sendingQueue: false,
	_viewEngine: null,

	init: function (controller) {
		this._super.init(controller);

		if (valid.indexOf(options.type) > -1) {
			this.controller._import('Component', 'Emailer/' + options.type);

			this.use = this.controller['Emailer/' + options.type];

			this.use.configure(options);
		}
	},

	_render: function (layout, template, helpers) {
		if (!this._viewEngine) {
			this._viewEngine = new (require('../../views/engines/' + amp.config.view))(this.controller.request, this.controller.response);
		}

		return this._viewEngine.render('layouts/' + layout, 'emails/' + template, this._data, helpers || []);
	},

	set: function (name, value) {
		dottie.set(this._data, name, value);
	},

	reset: function () {
		this._data = {};
	},

	send: function (message, callback) {
		var i, stream,
			_this	= this,
			streams	= 0;

		message = amp.extend({
			from: options.from,
			layout: 'default',
			template: 'index',
			helpers: []
		}, message || {});

		message.html = this._render(message.layout, message.template, message.helpers);

		if (Array.isArray(message.attachment) && message.attachment.length > 0)
		{
			for (i in message.attachment) {
				if ('data' in message.attachment[i]) {
					// do nothing
				} else if ('path' in message.attachment[i]) {
					stream = fs.createReadStream(message.attachment[i].path, {
						encoding: 'utf8'
					});

					stream.pause();

					message.attachment[i].path = null;

					delete message.attachment[i].path;
				}

				if (stream || 'stream' in message.attachment[i]) {
					streams++;

					message.attachment[i].stream = null;

					delete message.attachment[i].stream;

					(function (i, stream) {
						var file = '';

						stream.resume();

						stream.on('data', function (data) {
							file += data;
						});

						stream.on('end', function () {
							--streams;

							message.attachment[i].data = file;

							if (streams === 0) {
								_this.use.send(message)
							}
						});
					})(i, stream);
				}

				stream = null;
			}

			if (streams !== 0) {
				return;
			}
		}

		if (this.use) {
			this.use.send(message, callback);
		} else {
			throw new Error('No Emailer chosen. Please configure Emails in APP/config/core.js');
		}
	},

	queue: function (message, callback) {
		this._queue.push([message, callback, this._data]);
		this.reset();
	},

	queueSend: function (callback) {
		var _this	= this,
			entry	= this._queue.shift();

		if (this._sendingQueue === false) {
			this._sendingQueue = [callback];
		} else if (callback) {
			console.log('WARNING: Called EmailsComponent#queueSend multiple times before queue finished. If emails are constantly being queued, callbacks may be unnecessarily delayed (or potentially never be called). Under controlled circumstances, this warning can be ignored.'.red);

			this._queue.unshift(entry);
			this._sendingQueue.push(callback);

			return;
		}

		if (entry) {
			this._data = entry[1];

			this.send(entry[0], function (err, success) {
				if (typeof entry[1] === 'function') {
					entry[1](err, success);
				}

				_this.queueSend();
			});

			this.reset();
		} else {
			if (Array.isArray(this._sendingQueue)) {
				this._sendingQueue.forEach(function (callback) {
					if (typeof callback === 'function') {
						callback();
					}
				});
			}
		}
	}
});