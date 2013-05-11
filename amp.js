var amp		= module.exports,
	utils	= require('./utils/base'),
	fs		= require('fs'),
	app		= require('path').dirname(require.main.filename),
	colors	= require('colors');

utils.extend(amp, utils);
utils.extend(amp, {
	db: null,
	constants: {
		app_path: app
	},
	config: utils.extend({},
		require(app + '/config/core'),
		{database: require(app + '/config/database')}
	),
	route: require('./utils/route'),
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
});

require(app + '/config/routes');

if (!amp.config.buildr) {
	amp.config.buildr.srcPath = amp.constants.app_path + '/webroot' + amp.config.buildr.srcPath;
	amp.config.buildr.outPath = amp.constants.app_path + '/webroot' + amp.config.buildr.outPath;

	//amp.config.buildr.bundleScriptPath	= amp.config.buildr.srcPath + amp.config.buildr.bundleScriptPath;
	amp.config.buildr.bundleStylePath	= amp.config.buildr.srcPath + amp.config.buildr.bundleStylePath;

	var buildr = require('buildr');
	amp.buildr = buildr.createInstance(amp.config.buildr);

	amp.buildr.process(function (err) {
		if (err && err.errno) {
			throw err;
		}

		return console.log('Building complete.');
	});
};

amp.Controller		= require('./controllers/_controller.js');
amp.AppController	= require(app + '/controllers/_app_controller.js');