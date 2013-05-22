var paths, config,
	amp		= module.exports = require('./utils/base'),
	colors	= require('colors');

require(amp.constants.app_path + '/config/routes');

amp.Controller		= require('./controllers/_controller.js');
amp.Component		= require('./controllers/components/_component.js');
amp.AppController	= require(amp.constants.app_path + '/controllers/_app_controller.js');