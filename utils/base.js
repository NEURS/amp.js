var amp, paths, config, dbDefaults,
	path	= require('path'),
	app		= path.dirname(require.main.filename),
	db		= require('sequelize'),
	emitter	= require('events').EventEmitter;

paths = {
	app_path: app,
	cache: path.join(app, '/cache'),
	config: path.join(app, '/config'),
	controllers: path.join(app, '/controllers'),
	libs: path.join(app, '/libs'),
	locale: path.join(app, '/locale'),
	models: path.join(app, '/models'),
	views: path.join(app, '/views'),
	webroot: path.join(app, '/webroot'),
};

config			= require(path.join(paths.config, '/core'));
config.database	= require(path.join(paths.config, '/database'));

amp = module.exports = {
	db: null,
	stores: {},
	constants: paths,
	config: config,
	repl: config.repl ? require('./repl.js') : false,
	init: function (host, ports) {
		var config = {};

		if (!host || !host.length || !host.match(/^[A-Za-z0-9.-]+$/)) {
			throw new Error('Host name required!');
		}

		if (amp.config.env !== 'production' && host !== 'localhost') {
			host = '(localhost|' + host + ')';
		}

		if (!ports || !ports.length) {
			ports = [80];
		}

		this.config.host = '^' + host + '(:' + ports.join('|:').replace(/[|]?false[|]?/, '') + ')';

		if (ports.indexOf(80) >= 0) {
			this.config.host += '?';
		}

		this.config.host += '$';

		if (typeof amp.config.database === 'object' && amp.config.database !== null) {
			amp.deepExtend(config, dbDefaults);

			if (typeof amp.config.database.default === 'object') {
				amp.deepExtend(config, amp.config.database.default);
			}

			if (typeof amp.config.database[amp.config.env] === 'string') {
				amp.deepExtend(config, amp.config.database[amp.config.env]);
			}

			if (amp.config.env !== 'development') {
				if (config.username === 'root') {
					throw new Error('DATABASE ERROR: User "root" cannot be used');
				} else if (!config.password) {
					throw new Error('DATABASE ERROR: Password cannot be empty');
				}
			}

			amp.db			= new db(config.database, config.username, config.password, config);
			amp.db.Utils	= db.Utils;
		}
	},
	extend: function () {
		var i, j, g, s;

		if (arguments.length < 2 || typeof arguments[0] !== 'object') {
			return false;
		}

		for (i = 1; i < arguments.length; i++) {
			if (typeof arguments[i] !== 'object') {
				return false;
			}

			for (j in arguments[i]) {
				if (arguments[i].hasOwnProperty(j)) {
					g = arguments[i].__lookupGetter__(j);
					s = arguments[i].__lookupSetter__(j);

					if (g || s) {
						if (g) {
							arguments[0].__defineGetter__(j, g);
						}

						if (s) {
							arguments[0].__defineSetter__(j, s);
						}
					} else {
						arguments[0][j] = arguments[i][j];
					}
				}
			}
		}

		return arguments[0];
	},
	deepExtend: function (dest, from) {
		var destination,
			props = Object.getOwnPropertyNames(from);

		props.forEach(function (name) {
			if (typeof from[name] === 'object') {
				if (typeof dest[name] !== 'object') {
					dest[name] = {}
				}

				amp.deepExtend(dest[name],from[name]);
			} else {
				destination = Object.getOwnPropertyDescriptor(from, name);
				Object.defineProperty(dest, name, destination);
			}
		});
	},
	Class: (function () {
		var Class			= function () {},
			initializing	= false;

		Class.extend = function (prop) {
			var proto;

			initializing	= true;
			proto			= new this();
			initializing	= false;

			amp.extend(proto, prop);

			proto._super = this.prototype;

			function Class () {
				if (!initializing && this.init) {
					this.init.apply(this, arguments);
				}
			}

			Class.prototype				= proto;
			Class.prototype.constructor	= Class;
			Class.extend				= arguments.callee;

			return Class;
		};

		return Class;
	})(),
	string: require('underscore.string'),
	errors: {
		server: function (server, port) {
			return function (e) {
				if (e.code === 'EADDRINUSE') {
					console.log('Address in use, retrying...'.red);

					setTimeout(function () {
						server.close();
						server.listen(port);
					}, 1000);
				}
			};
		}
	},
	lang: {
		lingo: require('lingo'),
		singularize: function (str) {
			return amp.lang.lingo.en.isSingular(str) ? str : amp.lang.lingo.en.singularize(str);
		},
		pluralize: function (str) {
			return amp.lang.lingo.en.isPlural(str) ? str : amp.lang.lingo.en.pluralize(str);
		}
	}
};

amp.route	= require('./route.js');
amp.cache	= new (require('./cache.js'));
amp.less	= new (require('./less.js'));

dbDefaults = {
	database: 'ampjs',
	username: 'root',
	password: '',
	host: 'localhost',
	port: 3306,
	dialect: 'mysql',
	define: {
		underscored: true,
		freezeTableName: false,
		syncOnAssociation: false,
		charset: 'utf8',
		collate: 'utf8_general_ci',
		classMethods: {
			enumValues: function (field, object) {
				var attribute, values;

				if (!field) {
					console.log('No field provided for Model#enumValues()');
					return null;
				}

				attribute = this.rawAttributes[field];

				if (!attribute) {
					console.log('Field "' + String(field) + '" does not exist in table: ' + this.tableName);
					return null;
				} else if (String(attribute.type) !== String(db.ENUM)) {
					console.log('Field "' + String(field) + '" is not ENUM in table: ' + this.tableName);
					return null;
				}

				if (object && Array.isArray(attribute.values)) {
					values = {};

					attribute.values.forEach(function (value) {
						values[value] = amp.string.humanize(value);
					});

					return values;
				}

				return attribute.values;
			},

			list: function (fields, options) {
				var nameFields	= fields,
					valueField	= 'id',
					event		= new emitter();

				event.success	= function (func) { return this.on('success', func); };
				event.error		= function (func) { return this.on('error', func); };

				if (typeof fields === 'string') {
					nameFields	= [fields];
					fields		= [valueField, fields];
				} else if (Array.isArray(fields)) {
					if (fields.length === 1) {
						fields.unshift(valueField);
					} else if (fields.length > 1) {
						valueField = fields[0];
						nameFields = fields.slice(1);
					} else {
						nameFields	= [valueField];
						fields		= [valueField, valueField];
					}
				} else {
					nameFields	= [valueField];
					fields		= [valueField, valueField];
				}

				if (!options) {
					options = {};
				}

				options.attributes = fields;

				this.findAll(options).success(function (list) {
					var i,
						ret = {};

					for (i = 0; i < list.length; i++) {
						ret[list[i][valueField]] = [];

						nameFields.forEach(function (value) {
							ret[list[i][valueField]].push(list[i][value]);
						});
					}

					event.emit('success', ret);
				}).error(function (error) {
					event.emit('error', error);
				}).on('sql', function (sql) {
					event.emit('sql', sql);
				});

				return event;
			}
		},
		instanceMethods: {
			setParent: function (parent_id, created, callback) {
				var parentData,
					_this	= this,
					model	= this.daoFactory;

				if (typeof parent_id === 'function') {
					callback	= parent_id;
					parent_id	= this.parent_id;
					created		= true;
				} else if (typeof created === 'function') {
					callback	= created;
					created		= true;
				}

				if (typeof parent_id === 'object') {
					if (parent_id.daoFactoryName != this.daoFactoryName) {
						callback(new Error('Model#setParent Error: Parent DAO does not match this DAO'));
						return;
					}

					parent_id = parent_id.dataValues.id;
				}

				if (this.dataValues.id == parent_id) {
					callback(new Error('Model#setParent Error: Parent ID cannot equal this ID'));
					return;
				}

				function _sync(shift, direction, conditions, field) {
					var set;

					if (!field || field === 'both') {
						_sync(shift, direction, conditions, 'lft');

						field = 'rght';
					}

					if (created) {
						conditions = [conditions, 'AND id !=', parseInt(_this.dataValues.id)].join(' ');
					}

					set = [field, direction, shift].join(' ');

					return amp.db.query('UPDATE accounts SET ' + field + ' = ' + set + ' WHERE ' + field + ' ' + conditions);
				}

				model.find({
					where: {id: parent_id},
					attributes: ['id', 'lft', 'rght']
				}).success(function (parent) {
					if (!parent) {
						callback(new Error('Model#setParent Error: Could not find parent (ID: ' + parent_id + ') in ' + model.name));
						return;
					}

					if ((_this.dataValues.lft < parent.dataValues.lft) && (_this.dataValues.rght > parent.dataValues.rght)) {
						callback(new Error('Model#setParent Error: Parent is a child of this'));
						return;
					}

					if (!_this.dataValues.lft && !_this.dataValues.rght) {
						_sync(2, '+', '>= ' + parent.dataValues.rght).success(function () {
							_this.parent_id	= parent_id;
							_this.lft		= parent.dataValues.rght;
							_this.rght		= parent.dataValues.rght + 1;

							_this.save(['parent_id', 'lft', 'rght']).success(function () {
								callback();
							}).error(callback);
						}).error(callback);
					}
				}).error(callback);
			}
		},
		timestamps: true
	},
	sync: {
		force: true
	},
	syncOnAssociation: true,
	pool: {
		maxConnections: 5,
		maxIdleTime: 30
	}
};