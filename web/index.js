//configure requirejs
requirejs.config({
	baseUrl: 'javascripts/client',
	paths: {
		shared: '../shared',
		'socket.io': '../../socket.io/socket.io'
	},
	shim: {
		'socket.io': {
			exports: 'io'
		}
	}
});

//run client application
requirejs([ 'main' ], function(main) {
	main();
});