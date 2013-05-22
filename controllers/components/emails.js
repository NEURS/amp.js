var amp		= require('amp.js'),
	fs		= require('fs'),
	valid	= ['postmark'];

module.exports = amp.Component.extend({
	options: null,
	use: null,

	configure: function (options) {
		this.options = options;

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

		this.use.send(message, callback);
	}
});