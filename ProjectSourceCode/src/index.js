// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************
const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part C.

//INFO: Connection to DB and initialize it with test data in initdata.js
const { bcrypt, db } = require('./resources/js/initdata'); // Connect from postgres DB and initialize it with test data

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
	extname: "hbs",
	layoutsDir: __dirname + "/views/layouts",
	partialsDir: __dirname + "/views/partials",
});

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
// === Use to connect to external APIs (i.e. PayPal) ===
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

app.use(express.static("resources"));

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************

// TODO - Include your API routes here
app.get('/db', (_, res) => {
	query = 'SELECT * FROM users'
	db.tx(async t => {
		const users = await t.manyOrNone('SELECT * FROM users');
		const groups = await t.manyOrNone('SELECT * FROM groups');
		const transactions = await t.manyOrNone('SELECT * FROM transactions');

		return { users, groups, transactions };
	})
		.then(data => {
			queries = {
				users: data.users,
				groups: data.groups,
				transactions: data.transactions,
			};

			res.send(queries);
		})
		.catch((error) => {
			console.log("ERROR:", error);
		});
});

app.get("/welcome", (req, res) => {
	res.json({ status: "success", message: "Welcome!" });
});

app.get("/", (req, res) => {
	res.render("pages/landing");
});

/* ================ Register ================ */

app.get("/register", (req, res) => {
	let errorMessage = req.query.error;
	let message = req.query.message;
	res.render("pages/register", { message: errorMessage || message });
});

app.post("/register", async (req, res) => {
	let passwordRegex = /^(?=.*d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
	if (!passwordRegex.test(req.body.password)) {
		res.status(400);
		res.render("pages/register", {
			message:
				"Invalid password. Password must contain at least one digit, one lowercase letter, one uppercase letter, and be at least 8 characters long.",
		});
		return;
		// res.redirect(400, "/register?error=" + encodeURIComponent(e.message));
		// return res
		//   .status(400)
		//   .send(
		//     "Password must contain at least one digit, one lowercase letter, one uppercase letter, and be at least 8 characters long."
		//   );
	}

	try {
		await db.tx(async (t) => {
			const user = await t.oneOrNone(
				`SELECT * FROM users WHERE users.username = $1`,
				req.body.username
			);

			if (user) {
				res.status(400);
				res.render("pages/register", { message: "Username already exists!" });
				return;
				// return res.redirect(400, "/register?error=" + encodeURIComponent(`User ${req.body.username} already exists!`));
				// throw new Error(`User ${req.body.username} already exists!`);
			}

			// Hash the password using bcrypt library
			const hash = await bcrypt.hash(req.body.password, 10);
			await t.none("INSERT INTO users(username, password, email) VALUES ($1, $2, $3);", [
				req.body.username,
				hash,
				req.body.email,
			]);

			// Redirect to the login page with a success message
			res.redirect(
				"/login?message=" + encodeURIComponent("Successfully registered!")
			);
			// return res.redirect(
			//   200, "/login?message=" + encodeURIComponent("Successfully registered!")
			// );
		});
	} catch (e) {
		console.error(e);
		res
			.status(500)
			.json({ error: "An error occurred while registering the user." });
		res.render("pages/register", {
			message: "Internal server error while registering. Please try again!",
		});
		// res.status(500).json({ error: "An error occurred while registering the user." });
		// res.redirect(500, "/register?error=" + encodeURIComponent(e.message));
		// return res.status(400).send(e.message);
		// res.status(500).json({ error: "An error occurred while registering the user." });
	}
});

/* ================ Login ================ */

app.get("/login", (req, res) => {
	let errorMessage = req.query.error;
	let message = req.query.message;
	res.render("pages/login", {
		message: errorMessage || message,
		error: errorMessage,
	});
});

app.post("/login", async (req, res) => {
	db.tx(async (t) => {
		// check if password from request matches with password in DB
		const user = await t.oneOrNone(
			`SELECT * FROM users WHERE users.username = $1`,
			req.body.username
		);
		if (!user) {
			// res.status(404);
			// res.render("pages/login", { message: `User ${req.body.username} not found in database.` });
			// return;
			// throw new Error(
			//   `User ${req.body.username} not found in database.`
			// ).status(404);
			// var err = new Error(`User ${req.body.username} not found in database.`);

			res.status(404);
			// err.status = 404;
			// console.log(`Error: ${err.message}, ${err.status}`);
			// throw err;
			res.render("pages/login", { message: `User ${req.body.username} not found in database.` });
			return
		}

		const match = await bcrypt.compare(req.body.password, user.password);
		if (!match) {
			// res.status(400);
			// throw new Error(`The password entered is incorrect.`).status(400);
			var err = new Error(`The password entered is incorrect.`);
			err.status = 400;
			console.log(`Error: ${err.message}, ${err.status}`);
			throw err;
		}
		req.session.user = user;
		req.session.save();
		res.redirect("/home");
	}).catch((err) => {
		console.error(err);
		res.status(err.status);
		res.render("pages/login", { message: err.message });
		// res.redirect("/login?error=" + encodeURIComponent(err.message));
	});
});

// Authentication Middleware.
const auth = (req, res, next) => {
	if (!req.session.user) {
		// Default to login page.
		// return res.redirect("/login");

		// Default to landing page.
		return res.redirect("/landing");
	}
	next();
};

// Authentication Required
app.use(auth);

app.get("/home", (req, res) => {
	if (req.session.user) {
		res.render("pages/home", {
			user: req.session.user,
			username: req.session.user.username,
			balance: req.session.user.balance,
			// members: req.session.user.members,
		});
	} else {
		// res.redirect("/login", { message: "Please login to access this page." });
		res.redirect(
			"/login?error=" + encodeURIComponent("Please login to access this page.")
		);
	}
});

app.post("/deposit", (req, res) => {

	try {
		


	} catch(err) {

	}

})

app.get("/logout", (req, res) => {
	req.session.destroy();
	res.render("pages/logout");
});

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
module.exports = app.listen(3000);
console.log("Server is listening on port 3000");
