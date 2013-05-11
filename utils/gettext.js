var Gettext,
	L10n = require('l10n');

module.exports = exports = Gettext = function (locale) {
	this.data	= {};
	this.locale	= new L10n(locale);
};

Gettext.prototype.set = function (locale) {
	this.locale.set(locale);
};

Gettext.prototype.get = function () {
	return this.locale.get();
};

Gettext.prototype.parse = function (data) {
	var i, match,
		rv			= {},
		buffer		= {},
		header		= {},
		lastBuffer	= '',
		errors		= [],
		lines		= data.split(/\n/);

	for (i = 0; i < lines.length; i++) {
		// Remove carriage returns
		lines[i] = lines[i].replace(/\r+$/, '');

		// Empty Line (Probably end of an entry)
		if (lines[i] === '') {
			// End of entry
			if (buffer.msgid !== undefined) {
				this.parse_entry(rv, buffer);

				buffer		= {};
				lastBuffer	= '';
			}

		// Ignore comments
		} else if (/^#/.test(lines[i])) {
			continue;

		// Message Context
		} else if (match = lines[i].match(/^msgctxt\s+(.+)$/)) {
			lastBuffer			= 'msgctxt';
			buffer[lastBuffer]	= this.parse_dequote(match[1]);

		// Message ID
		} else if (match = lines[i].match(/^msgid\s+(.*)/)) {
			lastBuffer			= 'msgid';
			buffer[lastBuffer]	= this.parse_dequote(match[1]);

		// Message ID Plural
		} else if (match = lines[i].match(/^msgid_plural\s+(.*)/)) {
			lastBuffer			= 'msgid_plural';
			buffer[lastBuffer]	= this.parse_dequote(match[1]);

		// Message String (and Plurals)
		} else if (match = lines[i].match(/^msgstr(\[\d\])?\s+(.*)/)) {
			lastBuffer			= 'msgstr_' + (match[1] === undefined ? '0' : match[1].replace(/^\[|\]$/g, ''));
			buffer[lastBuffer]	= this.parse_dequote(match[2]);

		// Line Continuations
		} else if (/^"/.test(lines[i])) {
			buffer[lastBuffer] += this.parse_dequote(lines[i]);

		// Unexpected strange line
		} else {
			errors.push("Strange line [" + i + "] : " + lines[i]);
		}
	}

	// Handle final entry
	if (buffer.msgid !== undefined) {
		this.parse_entry(rv, buffer);
	}

	// Parse the header
	if (!!rv[''] && !!rv[''][1]) {
		lines = rv[''][1].split(/\\n/);

		for (i = 0; i < lines.length; i++) {
			if (!lines[i].length) {
				continue;
			}

			match = lines[i].split(/:/);

			if (match.length > 1) {
				match[0] = match[0].toLowerCase();

				if (header[match[0]] && header[match[0]].length) {
					errors.push('SKIPPING DUPLICATE HEADER LINE: ' + lines[i]);
				} else if (/#-#-#-#-#/.test(match[0])) {
					errors.push('SKIPPING ERROR MARKER IN HEADER: ' + lines[i]);
				} else {
					header[match[0]] = match[1].replace(/^\s+|\s+$/, '');
				}
			} else {
				errors.push('PROBLEM LINE IN HEADER: ' + lines[i]);
			}
		}
	}

	rv[''] = header;

	return rv;
};

Gettext.prototype.parse_entry = function (rv, buffer) {
	var str, num;

	if (rv[buffer.msgctxt || 'default'] === undefined) {
		rv[buffer.msgctxt || 'default'] = {};
    }

    rv[buffer.msgctxt || 'default'][buffer.msgid] = {
    	plural: buffer.msgid_plural,
    	trans: []
    };

    for (str in buffer) {
    	if (str.indexOf('msgstr_') === 0) {
    		num = str.split(/_/)[1];

    		if (!isNaN(num)) {
	    		rv[buffer.msgctxt || 'default'][buffer.msgid].trans[parseInt(num)] = buffer[str];
	    	}
    	}
    }
};

Gettext.prototype.parse_dequote = function (str) {
	var match = str.match(/^"(.+)"/);

	if (match.length) {
		str = match[1];
	}

	// Unescape embedded quotes
	return str.replace(/\\"/g, "\"");
};

Gettext.prototype._ = function (msgid) {
	return this._dnp(null, null, msgid, null, 0);
}

Gettext.prototype._d = function (domain, msgid) {
	return this._dnp(domain, null, msgid, null, 0);
}

Gettext.prototype._n = function (msgid, msgid_plural, n) {
	return this._dnp(null, null, msgid, msgid_plural, n);
}

Gettext.prototype._p = function (msgctxt, msgid) {
	return this._dnp(null, msgctxt, msgid, null, 0);
}

Gettext.prototype._dn = function (domain, msgid, msgid_plural, n) {
	return this._dnp(domain, msgctxt, msgid, null, n);
}

Gettext.prototype._dp = function (domain, msgctxt, msgid) {
	return this._dnp(domain, msgctxt, msgid, null, 0);
}

Gettext.prototype._np = function (msgctxt, msgid, msgid_plural, n) {
	return this._dnp(null, msgctxt, msgid, msgid_plural, n);
}

/* TODO: plural replacement, sprintf replacement */
Gettext.prototype._dnp = function (domain, msgctxt, msgid, msgid_plural, n) {
	if (typeof msgid !== "string" || !msgid.length) {
		return '';
	}

	var trans,
		backup	= [],
		locale	= this.locale.get();

	domain	= domain && domain.length > 1 ? domain : 'default';
	msgctxt	= msgctxt && msgctxt.length > 1 ? msgctxt : 'default';
	n		= typeof n === "number" ? n : 0;

	do {
		trans = this.data[locale] &&
			this.data[locale][domain || 'default'] &&
			this.data[locale][domain || 'default'][msgctxt || 'default'] &&
			this.data[locale][domain || 'default'][msgctxt || 'default'][msgid] &&
			this.data[locale][domain || 'default'][msgctxt || 'default'][msgid];

		if (trans) {
			trans = this.data[locale][domain || 'default'][msgctxt || 'default'][msgid];

			if (trans.trans[n] === undefined) {
				backup = [trans.trans[0] || backup[0], trans.trans[1] || backup[1]];
			} else {
				if (n > 0) {
					if (trans.plural === msgid_plural) {
						return trans.trans[n];
					} else {
						backup = [trans.trans[0] || backup[0], trans.trans[1] || backup[1], trans.trans[n] || backup[2]];
					}
				} else {
					return trans.trans[0];
				}
			}
		}
	} while (trans === false && locale !== locale.info(locale).fallback && (locale = locale.info(locale).fallback));

	return backup[2] || backup[1] || backup[0] || msgid;
};

Gettext.prototype.registerGlobals = function (names) {
	names = names || {};

	var i,
		that	= this,
		methods	= {
			_: name._ || '_',
			_d: name._d || '_d',
			_n: name._n || '_n',
			_p: name._p || '_p',
			_dn: name._dn || '_dn',
			_dp: name._dp || '_dp',
			_np: name._np || '_np',
			_dnp: name._dnp || '_dnp'
		};

	for (i in methods) {
		if (i[0] === '_') {
			window[methods[i]] = (function (func) {
				return function () {
					that[func].apply(that, arguments);
				};
			}(i));
		}
	}
};



















