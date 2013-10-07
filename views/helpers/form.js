var validators, // at the bottom
	amp		= require('../../utils/base'),
	dottie	= require('dottie'),
	gettext	= require('./gettext'),
	html	= new (require('./html'));

module.exports = amp.Class.extend({
	_open: false,
	_post: null,
	_data: null,
	_loops: null,
	_gettext: null,

	get validators() {
		return validators;
	},

	settings: {
		wrap: 'div'
	},

	init: function (request, data) {
		this._gettext	= new gettext(request, data);
		this._post		= request.data;
		this._data		= data;
		this._loops		= {};
	},

	create: function (model, options) {
		if (this._open) {
			return html.comment('FORM IS ALREADY OPEN');
		}

		this._open	= model;
		this._loops	= {};
		options		= options || {};

		if (options.type === 'file') {
			options.method	= 'post';
			options.enctype	= 'multipart/form-data'
		}

		return html.openTag('form', {
			id: options.id || model + 'Form',
			action: options.action || '',
			method: options.method || 'post',
			class: options.class || '',
			enctype: options.enctype
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
		var before	= '',
			after	= '';

		if (!options && typeof caption === 'object') {
			options = caption;
			caption = options.label || options.value;
		}

		options = amp.extend({
			wrap: this.settings.wrap,
			wrapClass: 'input submit',
			class: null
		}, options || {});

		if (options.wrap) {
			before	= html.openTag(options.wrap, {class: options.wrapClass});
			after	= html.closeTag(options.wrap);
		}

		return before + html.openTag('input', {
			type: 'submit',
			value: this._gettext.gettext(caption || 'Save'),
			class: options.class
		}) + after;
	},

	label: function (fieldName, text, options) {
		var field = fieldName.split(/\./);

		if (field.length === 1) {
			field		= [this._open, field[0]];
			fieldName	= field.join('.');
		}

		options = options || {};

		return html.createTag('label', this._gettext.gettext(text), {
			class: options.class,
			for: options.for || amp.string.camelize('_' + fieldName.replace(/\./, '_')),
		});
	},

	input: function (fieldName, opts) {
		var i, options, fieldDataName,
			tag		= '',
			label	= '',
			before	= '',
			after	= '',
			field	= fieldName.split(/\./);

		opts = opts || {};

		if (!fieldName) {
			return html.comment('Missing Parameter');
		}

		if (field.length === 1) {
			field		= [this._open, field[0]];
			fieldName	= field.join('.');
		}

		if (opts.loop === true || !isNaN(opts.loop)) {
			if (fieldName in this._loops) {
				this._loops[fieldName]++;
			} else {
				this._loops[fieldName] = typeof opts.loop === 'number' ? opts.loop : 0;
			}

			if (typeof opts.class != 'string') {
				opts.class = ''
			}

			opts.class = (opts.class + ' ' + field.join('-').replace(/_/, '-').toLowerCase()).trim();

			field.splice(1, 0, this._loops[fieldName]);

			fieldName = field.join('.');
			opts.loop = true;
		}

		if ((!opts.type && fieldName.substr(-3) === '_id') || opts.type === 'radio') {
			if (!opts.options) {
				fieldDataName = field[field.length - 1];

				if (fieldName.substr(-3) === '_id') {
					fieldDataName = fieldDataName.substr(0, field[field.length - 1].length - 3);
				}

				fieldDataName = amp.lang.pluralize(fieldDataName);
				fieldDataName = amp.string.camelize(fieldDataName);

				opts.options = this._value(this._data, fieldDataName);
			}

			if (!opts.type && typeof opts.options === 'object') {
				opts.type = 'select';
			}
		}

		options = amp.extend({
			class: null,
			id: amp.string.camelize('_' + fieldName.replace(/\./g, '_')),
			name: (opts.type === 'file' ? 'file[' : 'data[') + field.join('][') + ']',
			type: 'text',
			value: opts.type === 'checkbox' ? 1 : this._value(this._post, fieldName),
			wrap: opts.type === 'hidden' ? null : this.settings.wrap,
			wrapClass: 'input ' + (opts.type || 'text'),
			placeholder: null,
			label: opts.type === 'hidden' ? false : amp.string.humanize(opts.loop ? field[2] : field[1])
		}, opts);

		if (!options.value && options.default) {
			options.value = options.default;
		}

		if (options.wrap) {
			before	= html.openTag(options.wrap, {class: options.wrapClass});
			after	= html.closeTag(options.wrap);
		}

		switch (options.type) {
			case 'select':
				tag = this._select(fieldName, options);
			break;

			case 'textarea':
				tag = html.createTag('textarea', options.value, {
					class: options.class,
					id: options.id,
					name: options.name,
					cols: options.cols,
					rows: options.rows,
					placeholder: this._gettext.gettext(options.placeholder),
					required: options.required ? true : null
				});
			break;

			case 'checkbox':
				if (!options.options) {
					options.options = {};
					options.options[options.value] = {label: options.label, checked: options.checked};
					options.label = false;
				}
			// no break;

			case 'radio':
				for (i in options.options) {
					tag += html.openTag('label', {
						class: options.labelClass || options.type
					});

					tag += html.openTag('input', {
						class: options.class,
						id: options.id + amp.string.camelize('_' + i),
						name: options.name,
						type: options.type,
						value: i,
						checked: options.options[i].checked != null ? options.options[i].checked : (String(options.type === 'radio' ? options.value : '') === i)
					});

					if (options.options[i].label) {
						tag += ' ' + html.createTag('span', this._gettext.gettext(options.options[i].label));
					}

					tag += html.closeTag('label');
				}
			break;

			default:
				tag = html.openTag('input', {
					class: options.class,
					id: options.id,
					name: options.name,
					type: options.type,
					value: options.value,
					placeholder: this._gettext.gettext(options.placeholder),
					required: options.required ? true : null,
					pattern: options.pattern
				});
			break;
		}

		if (options.label !== false) {
			label = this.label(fieldName, options.label, {for: options.id});
		}

		return before + label + tag + after;
	},

	inputs: function (fields) {
		var i,
			inputs = '';

		for (i in fields) {
			inputs += this.input(i, fields[i]);
		}

		return inputs;
	},

	_select: function (fieldName, opts) {
		var i, ret;

		ret = html.openTag('select', {
			class: opts.class,
			id: opts.id,
			name: opts.name,
			multiple: opts.multiple
		});

		for (i in opts.options) {
			if (Array.isArray(opts.options[i])) {
				opts.options[i] = opts.options[i].join(' ');
			}

			ret += html.createTag('option', this._gettext.gettext(opts.options[i]), {
				value: i,
				selected: String(opts.value) === String(i)
			});
		}

		ret += html.closeTag('select');

		return ret;
	},

	_value: function (data, fieldName) {
		return dottie.get(data, fieldName) || dottie.get(data, this._open + '.' + fieldName) || '';
	}
});

validators = {
	phone_number: '^(?:(?:\\+?1\\s*(?:[.-]\\s*)?)?(?:\\(\\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\\s*\\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\\s*(?:[.-]\\s*)?)([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\\s*(?:[.-]\\s*)?([0-9]{4})(?:\\s*(?:#|x\\.?|ext\\.?|extension)\\s*(\\d+))?$'
};