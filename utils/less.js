var amp		= require('./base'),
	less	= require('less'),
	fs		= require('fs'),
	mkdirp	= require('mkdirp'),
	path	= require('path');

module.exports = amp.Class.extend({
	watching: [],

	init: function () {
		var i;

		if (!!amp.config.less.packages) {
			for (i in amp.config.less.packages) {
				this.parsePackage(amp.config.less.packages[i], i);
			}
		}
	},

	parsePackage: function (inFile, outFile, force) {
		var _this	= this,
			imports	= [];

		force = !!force;

		if (!force && amp.cache.get('cache.less.' + path.join(amp.config.less.outPath, outFile))) {
			return;
		}

		if (typeof inFile === 'string') {
			inFile = [inFile];
		}

		inFile.forEach(function (file) {
			var filename = path.join(amp.config.srcPath, file);

			if (!_this.watching[filename]) {
				_this.watching[filename] = true;

				fs.watch(file, function (e) {
					_this.watching[filename] = false;

					_this.parsePackage(inFile, outFile, true);
				});
			}

			imports.push('@import "' + file + '";');
		});

		new(less.Parser)({
			paths: [path.join(amp.constants.webroot, amp.config.less.srcPath)],
			filename: outFile
		}).parse(imports.join("\n"), function (err, tree) {
		
		});
	},

	parseDir: function (dir, force) {
		var _this = this;

		force = !!force;

		fs.readdir(dir, function (err, files) {
			if (err) {
				throw err;
			}

			files.forEach(function (file) {
				var filename = path.join(dir, file);

				fs.stat(filename, function (err, stat) {
					if (err) {
						throw err;
					}

					if (stat && stat.isDirectory()) {
						_this.parse(filename, force);
					} else {
						_this.parseFile(filename, force);
					}
				});
			});
		});
	},

	parseFile: function (file, force) {
		var _this		= this,
			filename	= file.substr(amp.constants.webroot.length);

		force = !!force;

		if (!force && amp.cache.get('cache.less.' + filename)) {
			return;
		}

		fs.readFile(file, {encoding: 'utf8'}, function (err, data) {
			if (err) {
				throw err;
			}

			new(less.Parser)({
				paths: [path.join(amp.constants.webroot, amp.config.less.srcPath)],
				filename: filename
			}).parse(data, function (err, tree) {
				if (err) {
					throw err;
				}

				var css		= tree.toCSS({compress: amp.config.less.compress}),
					name	= path.dirname(filename).substr(amp.config.less.srcPath.length) + path.basename(filename, '.less') + '.css',
					path2	= path.dirname(file).substr(amp.constants.webroot.length + amp.config.less.srcPath.length);

				mkdirp(path.join(amp.constants.webroot, amp.config.less.outPath, path2), function (err) {
					if (err) {
						throw err;
					}

					fs.writeFile(path.join(amp.constants.webroot, amp.config.less.outPath, name), css, {encoding: 'utf8'}, function (err) {
						if (err) {
							throw err;
						}

						amp.cache.set('cache.less.' + filename, true, amp.config.less.ttl);

						if (amp.config.less.watch && !_this.watching[filename]) {
							_this.watching[filename] = true;

							fs.watch(file, function (e) {
								_this.watching[filename] = false;

								_this.parseFile(file, true);
							});
						}
					});
				});
			});
		});
	}
});