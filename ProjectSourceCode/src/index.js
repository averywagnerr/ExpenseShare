// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************
const express = require("express"); // To build an application server or API
const app = express();
const handlebars = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const axios = require("axios"); // To make HTTP requests from our server. We'll learn more about it in Part C.

//INFO: Connection to DB and initialize it with test data in initdata.js
const { bcrypt, db } = require("./resources/js/initdata"); // Connect from postgres DB and initialize it with test data

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
	extname: "hbs",
	layoutsDir: __dirname + "/views/layouts",
	partialsDir: __dirname + "/views/partials",
});

Handlebars.registerHelper('isEqual', function(arg1, arg2, options) {
	if (arg1 == arg2) {
		return true;
	}
	return false;
});

Handlebars.registerHelper('formatDate', function(datetime) {
	const date = new Date(datetime);
	const options = { month: 'short', day: 'numeric', year: 'numeric' };
	return date.toLocaleDateString('en-US', options);
});
const groupRoutes = require("./routes/group");

// <!-- Section 3 : App Settings -->

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



const multer = require("multer");
const mindee = require("mindee");


const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, "uploads/")
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname)
	},
});

const uploadStorage = multer({ storage: storage });

app.post("/upload", uploadStorage.single("file"), (req, res) => {
	console.log(req.file)


	const mindeeClient = new mindee.Client({ apiKey: process.env.API_KEY });

	// Load a file from disk
	const path = req.file.path;
	const inputSource = mindeeClient.docFromPath(path);

	// Parse the file
	const apiResponse = mindeeClient.parse(
		mindee.product.ReceiptV5,
		inputSource
	);

	// Handle the response Promise
	apiResponse.then((resp) => {
		// print a string summary
		console.log(resp.document.toString());
		var supplier_name = "";
		var purchase_subcategory = "";
		var total_amount = "";
		var reciept_parts = resp.document.toString().split(':');
		for (var i = 0; i < reciept_parts.length; i++) {
			if (reciept_parts[i] == "Purchase Subcategory") {
				console.log("Purchase subcategory:");
				console.log(reciept_parts[i + 1]);
				purchase_subcategory = reciept_parts[i + 1];
			}
			if (reciept_parts[i] == "Total Amount") {
				console.log("Total Amount:");
				console.log(reciept_parts[i + 1]);
				total_amount = reciept_parts[i + 1];
			}
			if (reciept_parts[i] == "Supplier Name") {
				console.log("Supplier name:");
				console.log(reciept_parts[i + 1]);
				supplier_name = reciept_parts[i + 1];
				break;
			}
		}

		const fs = require('fs');

		try {
			fs.unlinkSync(path);
			console.log('File deleted!');
		} catch (err) {
			// Handle specific error if any
			console.error(err.message);
		}

		db.tx(async t => {
			await db.one("INSERT INTO reciept_transactions (sender, receiver, amount, description) VALUES ($1, $2, $3, $4) RETURNING id",
				[req.session.user.username, supplier_name, total_amount, purchase_subcategory]).then((data) => {
					console.log("Transaction data: ", data);
					db.none("INSERT INTO user_to_reciept_transactions (username, transaction_id) VALUES ($1, $2)", [req.session.user.username, data.id])
				})
				.catch((err) => {
					console.error(err);
					res.render("pages/home", { message: "An error occurred while uploading your reciept data.", error: true });
					return;
				});
		})
	})


	const reciept_transactions = db.manyOrNone(
		// "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
		"SELECT * FROM reciept_transactions",
		req.session.user.id
	).then((reciept_transactions) => {
		const transactions = db.manyOrNone(
			// "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
			"SELECT * FROM transactions",
			req.session.user.id
		).then((transactions) => {
			res.render("pages/home", {
				user: req.session.user,
				username: req.session.user.username,
				reciept_transactions: reciept_transactions,
				transactions: transactions,
				balance: req.session.user.balance,
			});
		});
	});

	return;
});



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
		const userToGroups = await t.manyOrNone('SELECT * FROM user_to_groups');

		return { users, groups, transactions, userToGroups };
	})
		.then(data => {
			queries = {
				users: data.users,
				groups: data.groups,
				transactions: data.transactions,
				userToGroups: data.userToGroups,
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

/* ================ User Register ================ */

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


			var nodemailer = require('nodemailer');

			const transporter = nodemailer.createTransport({
				service: 'gmail',
				host: 'smtp.gmail.com',
				port: 465,
				secure: true,
				auth: {
					user: 'donotreply.expenseshare@gmail.com',
					pass: process.env.PASS,
				},
			});

			var mailOptions = {
				from: 'donotreply.expenseshare@gmail.com',
				to: req.body.email,
				subject: 'Welcome to ExpenseShare!',
				html: '<h1>Welcome!</h1> <br> ' +
					'We are happy you have signed up for our application. We strive to make all of our customers happy. <br>' +
					'Explore the application and have fun! <br> <br>' +
					'If its not financially responsible, account me out!! <br> ' +
					'We are funny too :) <br> <br>'
			};

			transporter.sendMail(mailOptions, function(error, info) {
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent: ' + info.response);
				}
			});


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

/* ================ User Login ================ */

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
			res.render("pages/login", {
				message: `User ${req.body.username} not found in database.`,
			});
			return;
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

// ***************************************************

// Authentication Middleware.
const auth = (req, res, next) => {
	if (!req.session.user) {
		return res.redirect("/landing");
	}
	next();
};

// Authentication Required
app.use(auth);

// *****************  Group Routes  ******************

app.use(groupRoutes, auth);

// *****************************************************

app.get("/home", (req, res) => {
	if (req.session.user) {
		// select from database all user transactions

		db.manyOrNone(
			"SELECT * FROM transactions where sender = $1 or receiver = $1",
			[req.session.user.username]
		).then((transactions) => {
			console.log(transactions);
			res.render("pages/home", {
				user: req.session.user,
				username: req.session.user.username,
				balance: req.session.user.balance,
				transactions: transactions,
				balance: req.session.user.balance,
			const reciept_transactions = db.manyOrNone(
				// "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
				"SELECT * FROM reciept_transactions",
				req.session.user.id
			).then((reciept_transactions) => {
				res.render("pages/home", {
					user: req.session.user,
					username: req.session.user.username,
					balance: req.session.user.balance,
					transactions: transactions,
					reciept_transactions: reciept_transactions,
					balance: req.session.user.balance,
				});
			});
		});

	} else {
		// res.redirect("/login", { message: "Please login to access this page." });
		res.render(
			"/login?error=" + encodeURIComponent("Please login to access this page.")
		);
	}
});

app.post("/deposit", async (req, res) => {

	try {


		console.log(req.body)

		let deposit = parseFloat(req.body.deposit_amount)
		let withdraw = parseFloat(req.body.withdraw_amount)

		let curr_balance = parseFloat(req.session.user.balance)

		let newBalance = curr_balance + (deposit - withdraw)

		newBalance = parseFloat(newBalance)

		const query = await db.none(`UPDATE users SET balance = ${newBalance} WHERE username = '${req.session.user.username}'`)//update user balance in database

		req.session.user.balance = newBalance

		const transactions = db.manyOrNone(
			// "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
			"SELECT * FROM transactions",
			req.session.user.id
		).then((transactions) => {
			const reciept_transactions = db.manyOrNone(
				// "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
				"SELECT * FROM reciept_transactions",
				req.session.user.id
			).then((reciept_transactions) => {
				res.render("pages/home", {
					user: req.session.user,
					username: req.session.user.username,
					transactions: transactions,
					reciept_transactions: reciept_transactions,
					balance: newBalance,
				});
			});
		});

	} catch (err) {

		console.log(err)
		res.status(400).send()

	}

})

app.post("/groupexpense", async function(req, res) {
	//INFO: Make sure the sender is in the group
	let inGroup = false;
	await db.oneOrNone("SELECT * FROM user_to_groups WHERE username = $1 AND groupname = $2",
		[req.session.user.username, req.body.groupname])
		.then((user) => {
			if (user) {
				inGroup = true;
			}
		})
		.catch((err) => {
			console.error(err);
			res.render("pages/home", { message: "An error occurred while validating group membership.", error: true });
			return;
		});

	if (!inGroup) {
		res.render("pages/home", { message: "You are not in the group or this group does not exist!", error: true });
		return;
	}

	let members = [];
	await db.manyOrNone("SELECT username FROM user_to_groups WHERE groupname = $1", req.body.groupname)
		.then((users) => {
			users.forEach((user) => {
				console.log("User: ", user);
				members.push(user.username);
			});
		})
		.catch((err) => {
			console.error(err);
			res.render("pages/home", { message: "An error occurred while fetching group members.", error: true });
			return;
		});

	for (let i = 0; i < members.length; i++) {
		if (members[i] !== req.session.user.username) {
			await db.one("INSERT INTO transactions (sender, receiver, amount, description) VALUES ($1, $2, $3, $4) RETURNING id",
				[req.session.user.username, members[i], (req.body.expenseamount / members.length), req.body.description]).then((data) => {
					db.none("INSERT INTO user_to_transactions (username, transaction_id, is_sender) VALUES ($1, $2, $3)", [members[i], data.id, false])
				})
				.catch((err) => {
					console.error(err);
					res.render("pages/home", { message: "An error occurred while adding group expense.", error: true });
					return;
				});
		}
	}

	res.render("pages/home", { message: "Successfully added group expense." });
});

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
