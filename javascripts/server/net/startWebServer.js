define([
	'path',
	'module',
	'express'
], function(
	path,
	module,
	express
) {
	var baseDir = path.join(path.dirname(module.uri), '/../../..');

	return function startWebServer() {
		//create web server
		var app = express();

		//host directories
		app.use(express.static(path.join(baseDir, '/web')));
		app.use('/javascripts/client', express.static(path.join(baseDir, '/javascripts/client')));
		app.use('/javascripts/shared', express.static(path.join(baseDir, '/javascripts/shared')));

		//host files
		app.get('/lib/require.js', function(req, res) { res.sendFile(path.join(baseDir, '/node_modules/requirejs/require.js')); });
		app.get('/lib/cookies-js.js', function(req, res) { res.sendFile(path.join(baseDir, '/node_modules/cookies-js/dist/cookies.min.js')); });

		//start web server
		return app.listen(process.env.PORT || 3000);
	};
});