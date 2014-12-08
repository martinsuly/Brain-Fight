var Crypto = require('crypto');

module.exports = function(server, redis)
{

	// renders main page
	server.get('/:token?', function(req, res)
	{
		if (!req.cookies.player_token)
			res.cookie('player_token', Crypto.createHash('md5').update(Crypto.randomBytes(20)).digest('hex'), { maxAge: 999999999999 });

		res.render('layout', {
			js_data: JSON.stringify({
				token: req.params.token ? req.params.token : false
			}),
			partials: {
				create_game: 'create-game.html',
				get_ready: 'get-ready.html',
				game: 'game.html'
			}
		});
	});

}