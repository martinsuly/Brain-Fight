// define app global object
var ExpressSession = require('express-session'),
	ConnectRedis = require('connect-redis')(ExpressSession),
	CookieParser = require('cookie-parser'),
	Express = require('express'),
	server = Express(),
	redis = require('redis').createClient(),
	ExpressHandlebars = require('./express-handlebars'),
	http = require('http').Server(server),
	io = require('socket.io')(http),
	SocketCookieParser = require('socket.io-cookie');

// set template engine
server.engine('html', ExpressHandlebars());

server.set('view engine', 'html');
server.set('views', __dirname + '/views');

// add middlewares
server.enable('trust proxy');

server.use(ExpressSession(
{
	store: new ConnectRedis({
		client: redis,
		host: '127.0.0.1',
		port: 6379,
		db: 0
	}),
	key: 'brainfight',
	secret: 'asdfaskdfhweihfoiefasdf',
	cookie: {
		path: '/',
		httpOnly: false,
		maxAge: null
	},
	proxy: true,
	saveUninitialized: true,
	resave: true
}));

server.use(new CookieParser());

// pre-request middlware
server.use(function(req, res, next)
{
	if (!req.session) console.log('Session is not initialized.');

	next();
});

// main controller
require('./controller')(server, redis);

// socket IO handler
io.use(SocketCookieParser);

io.on('connection', function(socket)
{
	require('./socket')(socket, redis);
});

// catch all other requests as not found
server.use(function(req, res)
{
	res.status(404).send('Error 404: Page not found.');
});

// set error handler
server.use(function(err, req, res, next)
{
	console.log(err);
	res.status(500).send('Ooups, we have some problems. Please try back later.');
});

http.listen(8123, '127.0.0.1');

console.log('Brain Fight server started.');
