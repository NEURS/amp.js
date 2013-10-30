var amp		= require('../../utils/base'),
	fs		= require('fs'),
	Gettext	= require('node-gettext'),
	gettext	= new Gettext();
	
String.prototype.format = function () {
	Array.prototype.unshift.call(arguments, this);

	return amp.string.sprintf.apply(amp.string, arguments);
};

module.exports = amp.Class.extend({
	_gettext: null,
	_locale: null,

	init: function (request, data) {
		this.locale	= (request.accept &&
			request.accept.languages &&
			request.accept.languages.getBestMatch(amp.config.L10n.supported)) ||
			amp.config.L10n.supported[0];
	},

	set locale(value) {
		if (amp.config.L10n.supported.indexOf(value) > -1) {
			this._locale = value;
		} else {
			console.log('Locale "'.red + value + '" not supported. Please update your core configuration file in APP/config/core.js'.red);
		}
	},

	get locale() {
		return this._locale || amp.config.L10n.supported[0];
	},

	gettext: function (msgid) {
		return this.dnpgettext(false, undefined, msgid);
	},

	dgettext: function (domain, msgid) {
		return this.dnpgettext(domain, undefined, msgid);
	},

	ngettext: function (msgid, msgid_plural, n) {
		return this.dnpgettext(false, undefined, msgid, msgid_plural, n);
	},

	pgettext: function (context, msgid) {
		return this.dnpgettext(false, context, msgid);
	},

	dngettext: function (domain, msgid, msgid_plural, n) {
		return this.dnpgettext(domain, undefined, msgid, msgid_plural, n);
	},

	dpgettext: function (domain, context, msgid) {
		return this.dnpgettext(domain, context, msgid);
	},

	npgettext: function (context, msgid, msgid_plural, n) {
		return this.dnpgettext(false, context, msgid, msgid_plural, n);
	},

	dnpgettext: function (domain, context, msgid, msgid_plural, n) {
		var file;

		domain = this.locale + "__" + (domain || 'default');

		if (!gettext._domains[domain]) {
			file = amp.constants.locale + '/' + this.locale.toLowerCase().replace(/-/, '_') + '/LC_MESSAGES/' + domain + '.po';

			if (fs.existsSync(file)) {
				gettext.addTextdomain(domain, fs.readFileSync(file));
			}
		}

		gettext.textdomain(domain);

		return gettext.dnpgettext(domain, context, msgid, msgid_plural, n) || '';
	}
});