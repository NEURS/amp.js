var amp		= require('../utils/base'),
	fs		= require('fs'),
	zlib	= require('zlib');

/**
 * TODO:
 * -Load Compoonents/Models upon init
 */
module.exports = amp.Class.extend({
	_viewEngine: null,
	_rendered: false,

	_components: null,
	_models: null,
	_helpers: null,

	_layout: 'default',

	/* Default Headers */
	_defaultHeaders: {
		'Content-Type': 'text/html;charset=utf-8'
	},

	_data: null,
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

	init: function () {
		this._components	= this._components !== null ? this._components : [];
		this._models		= this._models !== null ? this._models : [];
		this._helpers		= this._helpers !== null ? this._helpers : [];
		this._data			= {};
	},

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

				this[className] = new (this[className])(this);
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

		this._viewEngine = new (require('../views/engines/' + amp.config.view))(this.request, this.response);

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
			code = 302;
		}

		if (code && !url) {
			url		= code;
			code	= 302;
		}

		this.response.writeHead(code, {
			Location: url,
			'Content-Length': Buffer.byteLength(String(code), 'utf8')
		});

		this.response.end(this.request.method === 'HEAD' ? '' : String(code));

		this._rendered = true;
	},

	render: function (code, file) {
		var content	= '',
			views	= amp.constants.views;

		if (this._rendered) {
			return false;
		}

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
			switch (this.request.accept.bestEncoding) {
				case 'deflate':
					zlib.deflate(content, this._compressCallback(code, content, 'deflate'));
				break;

				case 'gzip':
					zlib.gzip(content, this._compressCallback(code, content, 'gzip'));
				break;

				default:
					this._compressCallback(code, content, 'identity')(true);
				break;
			}
		} else {
			this.response.writeHead(code);
			this.response.end();
		}

		this._rendered = true;
	},

	_compressCallback: function (code, content, type) {
		var _this = this;

		return function (err, buffer) {
			if (err) {
				_this.response.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
				_this.response.writeHead(code);
				_this.response.write(content);
			} else {
				_this.response.setHeader('Content-Length', buffer.length);
				_this.response.writeHead(code, {'Content-Encoding': type});
				_this.response.write(buffer.toString('utf8'));
			}

			_this.response.end();
		}
	}
});