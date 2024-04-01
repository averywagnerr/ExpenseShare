// ----------------------------------   DEPENDENCIES  ----------------------------------------------
const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');

// -------------------------------------  APP CONFIG   ----------------------------------------------

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
	extname: 'hbs',
	layoutsDir: __dirname + '/views/layouts',
	partialsDir: __dirname + '/views/partials',
});

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
// set Session
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		saveUninitialized: false,
		resave: false,
	})
);
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);

// -------------------------------------  DB CONFIG AND CONNECT   ---------------------------------------
const dbConfig = {
	host: 'db',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);

// db test
db.connect()
	.then(obj => {
		obj.done(); // success, release the connection;
	})
	.catch(error => {
		console.log('DB CONNECTION ERROR', error.message || error);
	});

// Database test route
app.get('/db', (req, res) => {
	query = 'SELECT * FROM users'
	db.tx(async t => {
		const users = await t.manyOrNone('SELECT * FROM users');
		const groups = await t.manyOrNone('SELECT * FROM groups');

		return { users, groups };
	})
		.then(data => {
			queries = {
				users: data.users,
				groups: data.groups,
			};

			res.send(queries);
		})
		.catch(error => {
			console.log('ERROR:', error);
		});
});

// Start server listening
app.listen(3000);
