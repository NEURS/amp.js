var amp	= require('../../utils/base');

module.exports = amp.Class.extend({
	selfClosingTags: ['area', 'base', 'br', 'col', 'command', 'embed', 'frame', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'],

	minimizedAttributes: ['compact', 'checked', 'declare', 'readonly', 'disabled', 'selected', 'defer', 'ismap', 'nohref', 'noshade', 'nowrap', 'multiple', 'noresize', 'autoplay', 'controls', 'loop', 'muted', 'required', 'novalidate', 'formnovalidate'],

	init: function () {},

	createTag: function (tagName, content, attributes) {
		if (typeof content === 'object') {
			attributes	= content;
			content		= '';
		}

		if (this.selfClosingTags.indexOf(tagName) > -1) {
			return this.openTag(tagName, attributes);
		} else {
			return this.openTag(tagName, attributes) + content + this.closeTag(tagName);
		}
	},

	openTag: function (tagName, attributes) {
		var i,
			attr = [''];

		for (i in attributes) {
			if (typeof attributes[i] === 'boolean') {
				if (attributes[i] === false) {
					continue;
				}

				attributes[i] = i;
			} else if (attributes[i] === null || attributes[i] === undefined) {
				continue;
			}

			if (this.minimizedAttributes.indexOf(i) > -1) {
				attr.push(i);
			} else {
				attr.push(i + '="' + attributes[i] + '"');
			}
		}

		if (this.selfClosingTags.indexOf(tagName) > -1) {
			return '<' + tagName + attr.join(' ') + ' />';
		} else {
			return '<' + tagName + attr.join(' ') + '>';
		}
	},

	closeTag: function (tagName) {
		if (this.selfClosingTags.indexOf(tagName) > -1) {
			return '';
		} else {
			return '</' + tagName + '>';
		}
	},

	comment: function (text, force) {
		if (force || amp.config.env !== 'production') {
			// need to escape `text`

			return '<!-- ' + text + ' -->';
		}

		return '';
	}
});