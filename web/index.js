//configure requirejs
requirejs.config({
	baseUrl: BASE_URL + '/javascripts/client',
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
requirejs([ 'main', 'singlePlayerMain' ], function(main, singlePlayerMain) {
	function getQueryStringValue(key) {
		return unescape(window.location.search.replace(new RegExp('^(?:.*[&\\?]' + escape(key).replace(/[\.\+\*]/g, '\\$&') + '(?:\\=([^&]*))?)?.*$', 'i'), '$1'));
	}

	//if ?singleplayer=true is added to the URL, run the singleplayer
	if(getQueryStringValue('singleplayer') === 'true') {
		singlePlayerMain();
	}
	//otherwise default to the multiplayer game
	else {
		main();
	}
});