var amp		= require('../../utils/base'),
	html	= new (require('./html'));

module.exports = amp.Class.extend({
	_open: false,

	settings: {
		wrap: 'div'
	},

	_init: function () {},

	create: function (model, options) {
		if (this._open) {
			return html.comment('FORM IS ALREADY OPEN');
		}

		this._open	= model;
		options		= options || {};

		return html.openTag('form', {
			id: options.id || model + 'Form',
			action: options.action || '',
			method: options.method || 'post'
		});
	},

	end: function (options) {
		if (!this._open) {
			return html.comment('FORM IS NOT OPEN');
		}

		var before = '';

		if (typeof options === 'string') {
			before += this.submit(options);
		} else if (typeof options === 'object') {
			before += this.submit(options.label || options.value, options);
		}

		this._open = false;

		return before + html.closeTag('form');
	},

	submit: function (caption, options) {
		var before	= html.openTag(this.settings.wrap, {class: 'input submit'}),
			after	= html.closeTag(this.settings.wrap);

		options = options || {};

		if ('div' in options) {
			if (options.wrap) {
				before	= this.openTag(options.wrap, {class: options.class || 'input submit'});
				after	= this.closeTag(options.wrap);
			} else {
				before = after = '';
			}
		}

		return before + html.openTag('input', {
			type: 'submit',
			value: caption || 'Save'
		}) + after;
	},

	label: function (fieldName, text, options) {
		var field = fieldName.split(/\./);

		if (field.length === 1) {
			field		= [this._open, field[0]];
			fieldName	= field.join('.');
		}

		options = options || {};

		return html.createTag('label', text, {
			class: options.class,
			for: options.for || amp.string.camelize('_' + fieldName.replace(/\./, '_')),
		});
	},

	input: function (fieldName, opts) {
		var options,
			before	= '',
			after	= '',
			field	= fieldName.split(/\./);

		if (!fieldName) {
			return html.comment('Missing Parameter');
		}

		if (field.length === 1) {
			field		= [this._open, field[0]];
			fieldName	= field.join('.');
		}

		opts	= opts || {};
		options	= amp.extend({
			class: null,
			id: opts.type === 'hidden' ? null : amp.string.camelize('_' + fieldName.replace(/\./g, '_')),
			name: 'data[' + field.join('][') + ']',
			type: 'text',
			value: opts.type === 'checkbox' ? 1 : null,
			wrap: opts.type === 'hidden' ? null : this.settings.wrap,
			wrapClass: 'input ' + (opts.type || 'text')
		}, opts || {});

		if (options.wrap) {
			before	= html.openTag(options.wrap, {class: options.wrapClass});
			after	= html.closeTag(options.wrap);
		}

		if (!options.label && options.type === 'hidden') {
			options.label = false;
		}

		return before
			+ (options.label !== false ? this.label(fieldName, options.label || amp.string.humanize(field[1]), {for: options.id}) : '')
			+ html.openTag('input', {
				class: options.class,
				id: options.id,
				name: options.name,
				type: options.type,
				value: options.value
			})
			+ after;
	},

	inputs: function (fields) {
		var i,
			inputs = '';

		for (i in fields) {
			inputs += this.input(i, fields[i]);
		}

		return inputs;
	}
});