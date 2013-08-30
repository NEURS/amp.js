var bbcodes, videos, // at the bottom
	amp		= require('../../utils/base'),
	html	= new (require('./html'));

module.exports = amp.Class.extend({
	init: function (request, data) {
		
	},

	parse: function (body, rootOrUploadsPath) {
		var match, match2, replace,
			_this = this;

		if (rootOrUploadsPath) {
			body = body.replace(/[&<>'"]/g, function (match) {
				return '&' + {'&': 'amp', '<': 'lt', '>': 'gt', '"': '#34', '\'': '#39'}[match] + ';';
			});

			body = body.replace(/\r/g, '');
			body = body.replace(/\n\n/g, html.createTag('br') + html.createTag('br'));
			body = body.replace(/\/wuploads\//, rootOrUploadsPath);
		}

		for (match in bbcodes) {
			replace	= bbcodes[match];
			match2	= match.replace(/%/, '([\\s\\S]*?)');
			match2	= match2.replace(/\$/, '((?:' + match2.replace('$', '([\\s\\S]*?)') + '|[\\s\\S])*?)');

			(body.match(new RegExp(match2, 'gi')) || []).forEach(function (match) {
				var matches = (new RegExp(match2, 'i')).exec(match);

				matches.shift();

				if (Array.isArray(replace)) {
					body = body.replace(match, _this[replace[0]].apply(_this, matches));
					return;
				}

				matches.unshift(replace);

				body = body.replace(match, _this.parse(amp.string.sprintf.apply(amp.string, matches), false));
			});
		}

		return body;
	},

	videos: function (link) {
		var i, match;

		for (i in videos) {
			if (match = link.match(videos[i].match)) {
				return html.createTag('div', amp.string.sprintf(videos[i].replace, match.pop(), 600, 338), {class: 'video-container'});
			}
		}
	},

	urlencode: function (url) {
		return 'href="' + url.replace(/\s+/g, '%20') + '"';
	}
});

bbcodes = {};
bbcodes['\\[b\\]%\\[\\/b\\]']										= html.createTag('strong', '%1$s');
bbcodes['\\[i\\]%\\[\\/i\\]']										= html.createTag('em', '%1$s');
bbcodes['\\[u\\]%\\[\\/u\\]']										= html.createTag('span', '%1$s', {class: 'underline'});
bbcodes['\\[s\\]%\\[\\/s\\]']										= html.createTag('span', '%1$s', {class: 'strike'});
bbcodes['\\[br\\]']													= html.createTag('br');
bbcodes['\\[color=([#a-z0-9]+)\\]%\\[\\/color\\]']					= html.createTag('span', '%2$s', {style: 'color: %1$s'});
bbcodes['\\[size=([0-9]{1,2})\\]%\\[\\/size\\]']					= html.createTag('span', '%2$s', {'font-style': 'color: %1$s'});
bbcodes['\\[quote\\]%\\[\\/quote\\]']								= html.createTag('blockquote', '%1$s');
bbcodes['\\[quote(=([^\\]]+))?\\]%\\[\\/quote\\]']					= html.createTag('blockquote', '%3$s' + html.createTag('small', '%2$s'));
bbcodes['\\[ulist\\]$\\[\\/ulist\\]']								= html.createTag('ul', '%1$s');
bbcodes['\\[olist\\]$\\[\\/olist\\]']								= html.createTag('ol', '%1$s');
bbcodes['\\[item\\]%\\[\\/item\\]']									= html.createTag('li', '%1$s');
bbcodes['\\[url\\]%\\[\\/url\\]']									= html.createTag('a', '%1$s', {href: '%1$s'});
bbcodes['\\[url=([^\\]]+)\\]%\\[\\/url\\]']							= html.createTag('a', '%2$s', {href: '%1$s'});
bbcodes['\\[email\\]%\\[\\/email\\]']								= html.createTag('a', '%1$s', {href: 'mailto:%1$s'});
bbcodes['\\[email=([^\\]]+)\\]%\\[\\/email\\]']						= html.createTag('a', '%2$s', {href: 'mailto:%1$s'});
bbcodes['\\[img\\]%\\[\\/img\\]']									= html.createTag('img', '', {src: '%1$s', alt: ''});
bbcodes['\\[img=(left|right)\\]%\\[\\/img\\]']						= html.createTag('img', '', {class: 'pull-%1$s', src: '%2$s', alt: ''});
bbcodes['\\[img=(small|medium|large)\\]%\\[\\/img\\]']				= html.createTag('img', '', {class: 'size-%1$s', src: '%2$s', alt: ''})
bbcodes['\\[img=(left|right),(small|medium|large)\\]%\\[\\/img\\]']	= html.createTag('img', '', {class: 'pull-%1$s pull-%2$s', src: '%3$s', alt: ''});
bbcodes['\\[h([0-6])\\]%\\[\\/h[0-6]\\]']							= html.createTag('h%1$s', '%2$s');
bbcodes['\\[video\\]%\\[\\/video\\]']								= ['videos'],

// Non-BBCodes
bbcodes['href="([^"]+)"'] = ['urlencode'];

videos = {
	youtube: {
		match: /(?:youtu\.be\/)|(?:v[=\/])([a-z0-9-]+)/i,
		replace: '<iframe src="http://www.youtube.com/embed/%1$s" width="%2$s" height="%3$s" frameborder="0" allowfullscreen></iframe>'
	},
	vimeo: {
		match: /vimeo\.com\/([0-9]{1,10})/i,
		replace: '<iframe src="http://player.vimeo.com/video/%1$s?title=0&byline=0&portrait=0&autoplay=0" width="%2$s" height="%3$s" frameborder="0"></iframe>'
	}
};