var Crypto = require('crypto'),
	Async = require('async'),
	_ = require('lodash'),
	Question = require('./question');

module.exports = function(socket, redis)
{
	var player_token = socket.request.headers.cookie.player_token;

	socket.join(player_token);

	var formatGame = function(game_data, reversed)
	{
		if (game_data.player1_id == player_token)
		{
			if (reversed)
			{
				game_data.game.you = game_data.game.player2;
				game_data.game.friend = game_data.game.player1;
			}
			else
			{
				game_data.game.you = game_data.game.player1;
				game_data.game.friend = game_data.game.player2;
			}
		}
		else
		{
			if (!reversed)
			{
				game_data.game.you = game_data.game.player2;
				game_data.game.friend = game_data.game.player1;
			}
			else
			{
				game_data.game.you = game_data.game.player1;
				game_data.game.friend = game_data.game.player2;
			}
		}

		game_data.game.current_time = (new Date()).getTime();

		return game_data;
	};

	var checkPlayers = function(game_data)
	{
		return game_data.player1_id == player_token || game_data.player2_id == player_token;
	};

	var friendRoom = function(game_data)
	{
		if (game_data.player1_id == player_token)
			return game_data.player2_id;
		else
			return game_data.player1_id;
	}

	socket.on('create game', function(res)
	{
		if (res.token)
		{
			redis.get(res.token, function(err, game_data)
			{
				if (err || !game_data)
					return;

				game_data = JSON.parse(game_data);

				if (game_data.player1_id != player_token && !game_data.game.player2)
				{
					game_data.player2_id = player_token;

					game_data.game.player2 = {
						name: res.name,
						ready: false
					};

					socket.to(game_data.player1_id).emit('player ready', formatGame(game_data, true).game);
				}

				redis.set(res.token, JSON.stringify(game_data));

				socket.emit('game created', formatGame(game_data).game);
			});
		}
		else
		{
			var game_token = Crypto.createHash('md5').update(Crypto.randomBytes(20)).digest('hex'),
				game_data = {
					player1_id: player_token,
					player2_id: null,
					game:
					{
						token: game_token,
						player1: {
							name: res.name,
							ready: false,
							turn: true
						},
						player2: null,
						round: 1
					}
			};

			redis.set(game_token, JSON.stringify(game_data));

			socket.emit('game created', formatGame(game_data).game);
		}
	});

	socket.on('verify token', function(token)
	{
		redis.get(token, function(err, r)
		{
			var ret = false;

			if (!err && r)
			{
				r = JSON.parse(r);

				if (!r.player2_id || checkPlayers(r))
					ret = formatGame(r).game;
			}

			socket.emit('verify token', ret);
		});
	});

	socket.on('player ready', function(token)
	{
		redis.get(token, function(err, game_data)
		{
			if (!err && game_data)
			{
				var room = null;

				game_data = JSON.parse(game_data);

				if (game_data.player1_id == player_token)
				{
					game_data.game.player1.ready = true;
					room = game_data.player2_id;
				}
				else
				if (game_data.player2_id == player_token && game_data.game.player2)
				{
					game_data.game.player2.ready = true;
					room = game_data.player1_id;
				}

				redis.set(token, JSON.stringify(game_data));

				if (room)
					socket.to(room).emit('player ready', formatGame(game_data, true).game);

				if (game_data.game.player1.ready && game_data.game.player2 && game_data.game.player2.ready)
				{
					game_data.game.start_in = (new Date).getTime() + 1000 * 5;

					redis.set(token, JSON.stringify(game_data));

					socket.to(room).emit('game start', formatGame(game_data, true).game);
					socket.emit('game start', formatGame(game_data).game);
				}
			}
		});
	});

	socket.on('get question', function(token)
	{
		redis.get(token, function(err, game_data)
		{
			if (!err && game_data && (game_data = JSON.parse(game_data)) && checkPlayers(game_data))
			{
				var player;

				if (game_data.player1_id == player_token)
					player = game_data.game.player1;
				else
					player = game_data.game.player2;

				if (!player.turn)
					return;

				// generate question
				var q = Question(game_data.game.round),
					m = Math.floor((game_data.game.round - 1) / 5);

				if (m > 15) m = 15;

				game_data.answer = q.server;

				game_data.game.question = {
					time: (new Date).getTime() + 1000 * (20 - m),
					data: q.client
				};

				game_data.game.mark_answer = false;

				redis.set(token, JSON.stringify(game_data));

				socket.to(friendRoom(game_data)).emit('game play', formatGame(game_data, true).game);
				socket.emit('game play', formatGame(game_data).game);
			}
		});
	});

	socket.on('mark answer', function(data)
	{
		redis.get(data.token, function(err, game_data)
		{
			if (!err && game_data && (game_data = JSON.parse(game_data)) && checkPlayers(game_data))
			{
				var player;

				if (game_data.player1_id == player_token)
					player = game_data.game.player1;
				else
					player = game_data.game.player2;

				if (!player.turn)
					return;

				redis.set(data.token, JSON.stringify(game_data));

				game_data.game.mark_answer = data.answer;

				socket.to(friendRoom(game_data)).emit('game play', formatGame(game_data, true).game);
				socket.emit('game play', formatGame(game_data).game);
			}
		});
	});

	socket.on('answer question', function(data)
	{
		redis.get(data.token, function(err, game_data)
		{
			if (!err && game_data && (game_data = JSON.parse(game_data)) && checkPlayers(game_data))
			{
				var player;

				if (game_data.player1_id == player_token)
					player = game_data.game.player1;
				else
					player = game_data.game.player2;

				if (!player.turn)
					return;

				if (data.answer == 0 || data.answer != game_data.answer)
					player.lost = true;

				if (!player.lost)
				{
					// change turn
					if (game_data.game.player1.turn)
					{
						game_data.game.player1.turn = false;
						game_data.game.player2.turn = true;
					}
					else
					{
						game_data.game.player1.turn = true;
						game_data.game.player2.turn = false;
					}

					game_data.game.question = false;
					game_data.game.round = parseInt(game_data.game.round) + 1;
				}

				redis.set(data.token, JSON.stringify(game_data));

				socket.to(friendRoom(game_data)).emit('game play', formatGame(game_data, true).game);
				socket.emit('game play', formatGame(game_data).game);
			}
		});
	});

	socket.on('game update', function(token)
	{
		redis.get(token, function(err, game_data)
		{
			if (!err && game_data && (game_data = JSON.parse(game_data)) && checkPlayers(game_data))
			{
				socket.to(friendRoom(game_data)).emit('game play', formatGame(game_data, true).game);
				socket.emit('game play', formatGame(game_data).game);
			}
		});
	});

}