var amp		= require('../../utils/base'),
	fs		= require('fs'),
	ect		= require('ect'),
	engine	= ect({
		root: amp.constants.app_path + '/views',
		ext: '.html',
		cache: true,
		watch: true
	});

module.exports = amp.Class.extend({
	request: null,
	response: null,

	init: function (request, response) {
		this.request	= request;
		this.response	= response;
	},

	render: function (layout, view, data, helpers) {
		data.layout_view = view;

		helpers.forEach(function (name) {
			var file = '/helpers/' + amp.string.underscored(name);

			if (fs.existsSync(amp.constants.views + file)) {
				data[name] = new (require(amp.constants.views + file))(this.request.data, data);
			} else {
				data[name] = new (require('..' + file))(this.request.data, data);
			}
		});

		return engine.render(layout, data);
	}
});