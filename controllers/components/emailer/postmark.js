var amp			= require('amp.js'),
	postmark	= require('postmark')(amp.config.email.postmark.api_key);

module.exports = amp.Component.extend({
	configure: function () {},

	send: function (message, callback) {
		var i,
			email = {};

		if (message.from) {
			email.From = message.from;
		}

		if (message.to) {
			email.To = message.to;
		}

		if (message.cc) {
			email.Cc = message.cc;
		}

		if (message.bcc) {
			email.Bcc = message.bcc;
		}

		if (message.subject) {
			email.Subject = message.subject;
		}

		if (message.tag) {
			email.Tag = message.tag;
		}

		if (message.replyTo) {
			email.ReplyTo = message.replyTo;
		}

		if (message.headers) {
			email.Headers = message.headers;
		}

		if (message.html) {
			email.HtmlBody = message.html;
		}

		if (message.text) {
			email.TextBody = message.text;
		}

		if (Array.isArray(message.attachment) && message.attachment.length > 0) {
			email.Attachments = [];

			for (i in message.attachment) {
				email.Attachments.push({
					Name: message.attachment[i].name,
					Content: message.attachment[i].data.toString('base64'),
					ContentType: message.attachment[i].contentType,
				});
			}
		}

		return postmark.send(email, callback);
	}
});