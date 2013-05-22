var amp	= require('../utils/base'),
	fs	= require('fs');

/**
 * TODO:
 * -Load Compoonents/Models upon init
 */
module.exports = amp.Class.extend({
	_viewEngine: new (require('../views/engines/' + amp.config.view)),

	_components: [],
	_models: [],
	_helpers: [],

	_layout: 'default',

	/* Default Headers */
	_defaultHeaders: {
		'Content-Type': 'text/html'
	},

	_data: {},
	_set: function (name, value, looped) {
		if (typeof name === 'object') {
			if (looped) {
				return;
			}

			var i;

			for (i in name) {
				this._set(i, name[i], true);
			}
		} else {
			this._data[name] = value;
		}
	},

	/* Callbacks */
	_common: function () {},
	_beforeRender: function () {},
	_afterRender: function () {},

	/* Utility Component/Model Loader */
	_import: function (type, className) {
		if (!!this[className]) {
			return;
		}

		switch (type.toLowerCase()) {
			case 'component':
				var name = '/components/' + amp.string.underscored(className);

				if (fs.existsSync(amp.constants.controllers + name + '.js')) {
					this[className] = require(amp.constants.controllers + name);
				} else {
					this[className] = require('.' + name);
				}

				this[className] = new (this[className]);

				this[className]._init(this);
			break;

			case 'model':
				this[className] = amp.db.import(amp.constants.app_path + '/models/' + amp.string.underscored(className));

				if (this[className].options.associations) {
					var i, j, association, dummy;

					for (i in this[className].options.associations) {
						if (['hasOne', 'hasMany', 'belongsTo', 'habtm'].indexOf(i) !== -1) {
							for (j in this[className].options.associations[i]) {
								association	= this[className].options.associations[i][j];
								dummy		= amp.db.import(amp.constants.app_path + '/models/' + amp.string.underscored(association));

								if (i === 'habtm') {
									association = [this[className].tableName, dummy.tableName].sort().join('_');

									this[className].hasMany(dummy, {joinTableName: association});
									dummy.hasMany(this[className], {joinTableName: association});
								} else {
									this[className][i](dummy);
								}
							}
						}
					}
				}

				//this[className].sync();
			break;
		}
	},

	_init: function () {
		var i, name;

		for (i in this._defaultHeaders) {
			this.response.setHeader(i, this._defaultHeaders[i]);
		}

		for (i in this._components) {
			this._import('Component', this._components[i]);
		}

		if ((Array.isArray(this._models) && this._models.length === 0) || this._models === null) {
			this._models = [amp.string.classify(amp.lang.singularize(this._name))];
		}

		for (i in this._models) {
			this._import('Model', this._models[i]);
		}

		this._set({
			controller: this._name,
			action: this.request.route.action,
			title: amp.string.capitalize(this.request.route.action)
		});
	},

	header: function (key, value) {
		if (typeof value === 'string' && value.length > 0) {
			this.response.setHeader(key, value);
		} else {
			return this.response.getHeader(key);
		}
	},

	redirect: function (code, url) {
		if (!code && !url) {
			return false;
		}

		if (!code && url) {
			code = 307;
		}

		if (code && !url) {
			url		= code;
			code	= 307;
		}

		this.response.writeHead(code, {
			Location: url
		});

		this.response.end();
	},

	render: function (code, file) {
		var content	= '',
			views	= amp.constants.app_path + '/views';

		if (typeof file !== 'string' || !file.length) {
			if (typeof code === 'string') {
				if (code === (parseInt(code) + '')) {
					code = parseInt(code);
					file = this.request.route.action;
				} else {
					file = code;
				}
			} else {
				file = this.request.route.action
			}
		}

		code = typeof code === 'number' && code % 1 === 0 ? code : 200;

		if (code !== 200 && file === this.request.route.action) {
			if (fs.existsSync(views + '/errors/' + code + '.html')) {
				content = this.viewEngine.render('layouts/' + this._layout, 'errors/' + code, this._data, this._helpers);
			}
		} else {
			if (file[0] !== '/') {
				file = '/' + this.request.route.controller + '/' + file;
			}

			if (fs.existsSync(views + file + '.html')) {
				if (this._layout) {
					content	= this._viewEngine.render('layouts/' + this._layout, file.substr(1), this._data, this._helpers);
				} else {
					content	= this._viewEngine.render(file.substr(1), false, this._data, this._helpers);
				}
			} else {
				return this.render(404);
			}
		}

		if (content.length) {
			this.response.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
			this.response.writeHead(code);
			this.response.write(content);
		} else {
			this.response.writeHead(code);
		}

		this.response.end();
	}
});