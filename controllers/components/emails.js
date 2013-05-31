var amp		= require('amp.js'),
	fs		= require('fs'),
	valid	= ['postmark'],
	options	= amp.config.email;

module.exports = amp.Component.extend({
	options: null,
	use: null,
	queue: [],
	sendingQueue: false,

	init: function (controller) {
		this._super.init(controller);

		if (valid.indexOf(options.type) > -1) {
			this.controller._import('Component', 'Emailer/' + options.type);

			this.use = this.controller['Emailer/' + options.type];

			this.use.configure(options);
		}
	},

	send: function (message, callback) {
		var i, stream,
			_this	= this,
			streams	= 0;

		if (!message.from) {
			message.from = options.from;
		}

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
		this.queue.push([message, callback]);
	},

	queueSend: function (callback) {
		var _this	= this,
			entry	= this.queue.shift();

		if (this.sendingQueue === false) {
			this.sendingQueue = [callback];
		} else {
			console.log('WARNING: Called EmailsComponent#queueSend multiple times before queue finished. If emails are constantly being queued, callbacks may be unnecessarily delayed (or potentially never be called). Under controlled circumstances, this warning can be ignored.'.red);

			this.queue.unshift(entry);
			this.sendingQueue.push(callback);

			return;
		}

		if (entry) {
			this.send(entry[0], function (err, success) {
				if (typeof entry[1] === 'function') {
					entry[1](err, success);
				}

				_this.queueSend();
			});
		} else {
			if (Array.isArray(this.sendingQueue)) {
				this.sendingQueue.forEach(function (callback) {
					if (typeof callback === 'function') {
						callback();
					}
				});
			}
		}
	}
});