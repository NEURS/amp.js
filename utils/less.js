var amp		= require('./base'),
	less	= require('less'),
	fs		= require('fs'),
	mkdirp	= require('mkdirp');

module.exports = amp.Class.extend({
	watching: [],

	init: function () {
		this.parse(amp.constants.webroot + amp.config.less.srcPath);
	}

	parse: function (path, force) {
		var _this = this;

		force = !!force;

		fs.readdir(path, function (err, files) {
			if (err) {
				throw err;
			}

			files.forEach(function (file) {
				fs.stat(file, function (err, stat) {
					if (err) {
						throw err;
					}

					if (stat && stat.isDirectory()) {
						_this.parse(file, force);
					} else {
						_this.parseFile(file, force);
					}
				});
			});
		});
	},

	parseFile: function (file, force) {
		var filename = file.substr(amp.constants.webroot.length);

		force = !!force;

		if (!force && amp.cache.get('cache.less.' + filename)) {
			return;
		}

		fs.readFile(file, {encoding: 'utf8'}, function (err, data) {
			if (err) {
				throw err;
			}

			new(less.Parser)({
				paths: [amp.constants.webroot],
				filename: filename
			}).parse(data, function (err, tree) {
				if (err) {
					throw err;
				}

				var css		= tree.toCSS({compress: amp.config.less.compress}),
					name	= filename.substr(amp.config.less.srcPath.length),
					path2	= path.substr(amp.constants.webroot.length + amp.config.less.srcPath.length);

				mkdirp(amp.config.less.outPath + path2, function (err) {
					if (err) {
						throw err;
					}

					fs.writeFile(amp.config.less.outPath + name, css, {encoding: 'utf8'}, function (err) {
						if (err) {
							throw err;
						}

						amp.cache.set('cache.less.' + filename, true, amp.config.less.ttl);

						if (amp.config.less.watch && !_this.watching[filename]) {
							_this.watching[filename] = true;

							fs.watch(file, function (e, filename) {
								if (filename) {
									_this.parseFile(filename, true);
								}
							});
						}
					});
				});
			});
		});
	}
});