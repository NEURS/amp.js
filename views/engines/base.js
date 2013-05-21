var amp		= require('../../utils/base'),
	ect		= require('ect'),
	engine	= ect({
		root: amp.constants.app_path + '/views',
		ext: '.html',
		cache: true,
		watch: true
	});

module.exports = amp.Class.extend({
	render: function (layout, view, data, helpers) {
		data.layout_view = view;

		helpers.forEach(function (name) {
			data[name] = new (require(amp.constants.app_path + '/views/helpers/' + amp.string.underscored(name)));

			data[name]._init();
		});

		return engine.render(layout, data);
	}
});