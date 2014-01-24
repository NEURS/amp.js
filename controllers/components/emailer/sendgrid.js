var amp			= require('amp.js'),
	options		= amp.config.email.sendgrid,
	sendgrid	= require('sendgrid')(options.api_user, options.api_key, options.options);

module.exports = amp.Component.extend({
	configure: function () {},

	send: function (message, callback) {
		var email = new sendgrid.Email(message);

		if (message.cc) {
			email.addTo(message.cc);
		}

		if (message.replyTo) {
			email.replyto = message.replyTo;
		}

		if (Array.isArray(message.attachment) && message.attachment.length > 0) {
			for (i in message.attachment) {
				email.addFile({
					filename: message.attachment[i].name,
					content: message.attachment[i].data,
					contentType: message.attachment[i].contentType,
				});
			}
		}

		return sendgrid.send(email, callback);
	}
});