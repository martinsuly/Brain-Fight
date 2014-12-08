jQuery(function($)
{
	var Game = function(token)
	{
		var _this = this;

		this.token = token;
		this.socket = io();
		this.name = null;
		this.timer = null;

		// parts
		this.$parts = $('.part');
		this.$part_loader = $('#part_loader');
		this.$part_create_game = $('#part_create_game');
		this.$part_get_ready = $('#part_get_ready');
		this.$part_game = $('#part_game');

		// create game elements
		this.$input_name = $('input[name=name]', this.$part_create_game);
		this.$button_create = $('#create_game_button', this.$part_create_game);
		this.$invited_text = $('.invited-text', this.$part_create_game);

		// get ready elements
		this.$player1_name = $('.player1_name', this.$part_get_ready);
		this.$player2_name = $('.player2_name', this.$part_get_ready);
		this.$waiting_dimmer = $('.player .dimmer', this.$part_get_ready);
		this.$player1_ready = $('.player1_ready', this.$part_get_ready);
		this.$player2_ready = $('.player2_ready', this.$part_get_ready);
		this.$link_hint = $('.hint', this.$part_get_ready);
		this.$link_url = $('.message', this.$link_hint);

		$('.checkbox').checkbox({
			uncheckable: false
		});

		// game elements
		this.$player1_gname = $('.player1_name', this.$part_game);
		this.$player2_gname = $('.player2_name', this.$part_game);
		this.$round_number = $('.round-number', this.$part_game);
		this.$timer = $('.timer', this.$part_game);
		this.$question_image = $('.question-image', this.$part_game);
		this.$answer1_image = $('.answer1-image', this.$part_game);
		this.$answer2_image = $('.answer2-image', this.$part_game);
		this.$answer3_image = $('.answer3-image', this.$part_game);
		this.$answer4_image = $('.answer4-image', this.$part_game);
		this.$task = $('.task', this.$part_game);
		this.$dimmer_timer = $('.dimmer-timer', this.$part_game);
		this.$round_timer = $('.round-timer', this.$part_game);
		this.$dimmer_message = $('.dimmer-message', this.$part_game);
		this.$message_text = $('.message', this.$dimmer_message);
		this.$message_icon = $('i.icon', this.$dimmer_message);

		this.$dimmer_timer.dimmer({
			closable: false
		});

		this.$dimmer_message.dimmer({
			closable: false
		});

		this.bindEvents();
	}

	Game.prototype.updateURL = function(token)
	{
		window.history.replaceState({}, null, '/' + (token ? token : ''));
	}

	Game.prototype.bindEvents = function()
	{
		var _this = this;

		// handle socket events
		this.socket.on('connect', function()
		{
			if (_this.token)
				_this.socket.emit('verify token', _this.token);
			else
				_this.createGame();
		});

		this.socket.on('verify token', function(game)
		{
			if (!game)
			{
				_this.token = null;
				_this.updateURL();
				_this.createGame();
			}
			else
			{
				if (!game.you)
					_this.createGame(game);
				else
				{
					if (game.you.ready && game.friend && game.friend.ready)
						_this.game(game);
					else
						_this.getReady(game);
				}
			}
		});

		this.socket.on('game created', function(res)
		{
			_this.getReady(res);
		});

		this.socket.on('player ready', function(game)
		{
			if (game.friend)
			{
				_this.$link_hint.hide();

				_this.$player2_name.text(game.friend.name);
				_this.$waiting_dimmer.removeClass('active');

				if (game.friend.ready)
					_this.$player2_ready.checkbox('check');
				else
					_this.$player2_ready.checkbox('uncheck');
			}
			else
			{
				_this.$player2_name.text('(Not connected)');
				_this.$waiting_dimmer.addClass('active');
				_this.$player2_ready.checkbox('uncheck');
			}
		});

		this.socket.on('game start', function(game)
		{
			_this.game(game);
		});

		this.socket.on('game play', function(game)
		{
			_this.play(game);
		});

		// create/join to game
		this.$button_create.on('click', function()
		{
			if (_this.$button_create.hasClass('disabled'))
				return false;

			_this.$button_create.addClass('disabled loading');

			var name = _this.$input_name.val();

			if (name.length == 0)
			{
				_this.$button_create.removeClass('disabled loading');
				_this.$input_name.parent().addClass('error');
				return;
			}

			_this.socket.emit('create game', {
				name: name,
				token: _this.token
			});
		});

		// get ready section
		$('input', this.$player1_ready).on('change', function()
		{
			if ($(this).prop('checked'))
				_this.socket.emit('player ready', _this.token);
		});

		// answer question
		$('.answers .card').on('click', function()
		{
			var $this = $(this);

			if (!$this.hasClass('link'))
				return;

			$('.answers .card').removeClass('link');

			_this.socket.emit('mark answer', { token: _this.token, answer: $this.data('id') });
		});

		// select text on click
		this.$link_hint.on('click', function()
		{
			var doc = document, text = _this.$link_url[0], range, selection;

			if (doc.body.createTextRange)
			{
				range = document.body.createTextRange();
				range.moveToElementText(text);
				range.select();
			}
			else
			if (window.getSelection)
			{
				selection = window.getSelection();
				range = document.createRange();
				range.selectNodeContents(text);
				selection.removeAllRanges();
				selection.addRange(range);
			}
		});
	}

	Game.prototype.createGame = function(game)
	{
		this.$parts.hide();

		if (game)
		{
			$('.value', this.$button_create).text('Join game');
			this.$invited_text.text(game.friend.name + ' invited you to fight with him!').show();
		}
		else
		{
			$('.value', this.$button_create).text('Create Game');
			this.$invited_text.hide();
		}

		this.$button_create.removeClass('disabled loading');
		this.$input_name.val('');

		this.$part_create_game.show();
	}

	Game.prototype.getReady = function(game)
	{
		this.$parts.hide();

		this.token = game.token;
		this.updateURL(game.token);

		this.$player1_name.text(game.you.name);

		if (game.you.ready)
			this.$player1_ready.checkbox('check');
		else
			this.$player1_ready.checkbox('uncheck');

		if (game.friend)
		{
			this.$link_hint.hide();
			this.$player2_name.text(game.friend.name);
			this.$waiting_dimmer.removeClass('active');

			if (game.friend.ready)
				this.$player2_ready.checkbox('check');
			else
				this.$player2_ready.checkbox('uncheck');
		}
		else
		{
			this.$link_hint.show();
			this.$link_url.text('http://martinsuly.koding.io/' + game.token);
			this.$player2_name.text('(Not connected)');
			this.$waiting_dimmer.addClass('active');
			this.$player2_ready.checkbox('uncheck');
		}

		this.$part_get_ready.show();
	}

	Game.prototype.game = function(game)
	{
		var _this = this;

		this.$parts.hide();

		this.$player1_gname.text(game.you.name).removeClass('green');
		this.$player2_gname.text(game.friend.name).removeClass('green');
		this.$round_number.text(game.round);
		this.$timer.text('-');
		this.$task.hide();

		this.$part_game.show();
		this.play(game);
	}

	Game.prototype.play = function(game)
	{
		var _this = this,
			seconds = Math.round((game.start_in - game.current_time) / 1000);

		if (seconds > 0)
		{
			this.$task.hide();
			this.$round_timer.text(seconds);
			this.$dimmer_timer.dimmer('show');

			this.setTimer(seconds, function(c, a)
			{
				if (a)
				{
					_this.$dimmer_timer.dimmer('hide');

					if (game.you.turn)
						_this.socket.emit('get question', _this.token);
				}
				else
					_this.$round_timer.text(c);
			});

			return;
		}

		if (game.mark_answer)
		{
			if (this.timer)
				window.clearInterval(this.timer);

			$('[data-id=' + game.mark_answer + ']').addClass('marked');

			window.setTimeout(function()
			{
				if (game.you.turn)
					_this.socket.emit('answer question', { token: _this.token, answer: game.mark_answer});
			}, 2000);

			return;
		}

		if (game.you.lost)
		{
			this.showMessage('bug', 'YOU LOST!', 10, function()
			{
				_this.token = null;
				_this.updateURL('');
				_this.createGame();
			});

			return;
		}
		else
		if (game.friend.lost)
		{
			this.showMessage('trophy', 'YOU WON!', 10, function()
			{
				_this.token = null;
				_this.updateURL('');
				_this.createGame();
			});

			return;
		}

		if (game.question)
		{
			this.$round_number.text(game.round);

			// start timer
			var seconds = Math.round((game.question.time - game.current_time) / 1000);

			if (seconds > 0)
			{
				this.showMessage('arrow ' + (game.you.turn ? 'left' : 'right'), game.you.turn ? 'YOUR TURN!' : game.friend.name + "'S TURN!", 2, function()
				{
					var $cards = $('.answers .card').removeClass('marked');

					if (!game.you.turn)
					{
						_this.$player1_gname.removeClass('green');
						_this.$player2_gname.addClass('green');

						$cards.removeClass('link');
					}
					else
					{
						$cards.addClass('link');
						_this.$player1_gname.addClass('green');
						_this.$player2_gname.removeClass('green');
					}

					draw('canvas_q', 'canvas_a', 'canvas_b', 'canvas_c', 'canvas_d', game.question.data);


					_this.$task.show();

					_this.$timer.text(seconds);

					_this.setTimer(seconds, function(c, a)
					{
						_this.$timer.text(c);

						if (game.you.turn && a)
							_this.socket.emit('answer question', { token: _this.token, answer: 0 });
					});
				});
			}
			else
			if (game.you.turn)
				_this.socket.emit('answer question', { token: _this.token, answer: 0 });
		}
		else
		if (game.you.turn)
			_this.socket.emit('get question', _this.token);
	}

	Game.prototype.showMessage = function(icon, text, delay, cb)
	{
		var _this = this;

		this.$task.hide();
		this.$message_text.text(text);
		this.$message_icon.attr('class', 'icon ' + icon);
		this.$dimmer_message.dimmer('show');

		window.setTimeout(function()
		{
			_this.$dimmer_message.dimmer('hide');
			cb();
		}, delay * 1000);
	}

	Game.prototype.setTimer = function(seconds, cb)
	{
		var counter = seconds, _this = this;

		this.timer = window.setInterval(function()
		{
			counter--;

			if (counter == 0)
			{
				window.clearInterval(_this.timer);
				cb(counter, true);
			}
			else
				cb(counter, false);
		}, 1000);
	}

	new Game(js_data.token);

});