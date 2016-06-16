//configure requirejs
var requirejs = require('requirejs');
requirejs.config({
	baseUrl: __dirname + '/javascripts/server',
	paths: {
		shared: '../shared'
	},
	nodeRequire: require
});
require = requirejs;

//run server application
require('main')();