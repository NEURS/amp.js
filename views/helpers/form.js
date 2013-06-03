var amp		= require('../../utils/base'),
	html	= new (require('./html')),
	dottie	= require('dottie');

module.exports = amp.Class.extend({
	_open: false,
	_post: [],
	_data: [],
	_loops: {},

	settings: {
		wrap: 'div'
	},

	init: function (request, data) {
		this._post = request.data;
		this._data = data;
	},

	create: function (model, options) {
		if (this._open) {
			return html.comment('FORM IS ALREADY OPEN');
		}

		this._open	= model;
		this._loops	= {};
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
			value: caption || 'Save',
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

		return html.createTag('label', text, {
			class: options.class,
			for: options.for || amp.string.camelize('_' + fieldName.replace(/\./, '_')),
		});
	},

	input: function (fieldName, opts) {
		var options, tag, selectDataName,
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

		if (opts.type !== 'select' && fieldName.substr(-3) === '_id') {
			if (!opts.options) {
				selectDataName = field[field.length - 1].substr(0, field[field.length - 1].length - 3);
				selectDataName = amp.lang.pluralize(selectDataName);
				selectDataName = amp.string.camelize(selectDataName);

				opts.options = this._value(this._data, selectDataName);
			}

			if (typeof opts.options === 'object') {
				opts.type = 'select';
			}
		}

		options = amp.extend({
			class: null,
			id: amp.string.camelize('_' + fieldName.replace(/\./g, '_')),
			name: 'data[' + field.join('][') + ']',
			type: 'text',
			value: opts.type === 'checkbox' ? 1 : this._value(this._post, fieldName),
			wrap: opts.type === 'hidden' ? null : this.settings.wrap,
			wrapClass: 'input ' + (opts.type || 'text'),
			placeholder: null,
			label: amp.string.humanize(opts.loop ? field[2] : field[1])
		}, opts);

		if (!options.value && options.default) {
			options.value = options.default;
		}

		if (options.wrap) {
			before	= html.openTag(options.wrap, {class: options.wrapClass});
			after	= html.closeTag(options.wrap);
		}

		if (!options.label && options.type === 'hidden') {
			options.label = false;
		}

		if (options.type === 'select') {
			tag = this._select(fieldName, options);
		}
		else if (options.type === 'textarea') {
			tag = html.createTag('textarea', options.value, {
				class: options.class,
				id: options.id,
				name: options.name,
				cols: options.cols,
				rows: options.rows,
				placeholder: options.placeholder
			});
		} else {
			tag = html.openTag('input', {
				class: options.class,
				id: options.id,
				name: options.name,
				type: options.type,
				value: options.value,
				placeholder: options.placeholder
			});
		}

		if (options.label !== false) {
			options.label = this.label(fieldName, options.label, {for: options.id});
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

			ret += html.createTag('option', opts.options[i], {
				value: i,
				selected: String(opts.value) === String(i)
			});
		}

		ret += html.closeTag('select');

		return ret;
	},

	_value: function (data, fieldName) {
		return dottie.get(data, fieldName) || dottie.get(data, this._open + '.' + fieldName);
	}
});