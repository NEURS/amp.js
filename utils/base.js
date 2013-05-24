var amp, paths, config, dbDefaults,
	path	= require('path'),
	app		= path.dirname(require.main.filename),
	db		= require('sequelize');

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
	constants: paths,
	config: config,
	init: function (host, http, https) {
		var config = {};

		if (!host || !host.length || !host.match(/^[A-Za-z0-9.-]+$/) || isNaN(http) || (https && isNaN(https))) {
			throw new Error('Host name required!');
		}

		if (amp.config.env !== 'production' && host !== 'localhost') {
			host = '(localhost|' + host + ')';
		}

		this.config.host = '^' + host + ':(' + [http, https].join('|').replace(/[|]?false[|]?/, '') + ')$';

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

			amp.db = new db(config.database, config.username, config.password, config);
		}
	},
	extend: function () {
		var i, j;

		if (arguments.length < 2 || typeof arguments[0] !== 'object') {
			return false;
		}

		for (i = 1; i < arguments.length; i++) {
			if (typeof arguments[i] !== 'object') {
				return false;
			}

			for (j in arguments[i]) {
				if (arguments[i].hasOwnProperty(j)) {
					arguments[0][j] = arguments[i][j];
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
		var Class		   = function () {},
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

amp.route	= require('./route');
amp.cache	= new (require('./cache'));
amp.less	= new (require('./less'));

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
		//classMethods: {list: function (array fields, options) {}},
		//instanceMethods: {},
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