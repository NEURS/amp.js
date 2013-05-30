var amp		= require('../../utils/base'),
	html	= new (require('./html')),
	dottie	= require('dottie');

module.exports = amp.Class.extend({
	_open: false,
	_post: [],
	_data: [],

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
		var options, tag, selectDataName,
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

		opts = opts || {};

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
			id: opts.type === 'hidden' ? null : amp.string.camelize('_' + fieldName.replace(/\./g, '_')),
			name: 'data[' + field.join('][') + ']',
			type: 'text',
			value: opts.type === 'checkbox' ? 1 : this._value(this._post, fieldName),
			wrap: opts.type === 'hidden' ? null : this.settings.wrap,
			wrapClass: 'input ' + (opts.type || 'text'),
			placeholder: null
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

		return before
			+ (options.label !== false ? this.label(fieldName, options.label || amp.string.humanize(field[1]), {for: options.id}) : '')
			+ tag
			+ after;
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