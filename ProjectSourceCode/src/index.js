// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require("express"); // To build an application server or API
const app = express();
const handlebars = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require("path");
const pgp = require("pg-promise")(); // To connect to the Postgres DB from the node server
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require("bcrypt"); //  To hash passwords
const axios = require("axios"); // To make HTTP requests from our server. We'll learn more about it in Part C.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: "hbs",
  layoutsDir: __dirname + "/views/layouts",
  partialsDir: __dirname + "/views/partials",
});

// database configuration
const dbConfig = {
  host: "db", // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then((obj) => {
    console.log("Database connection successful"); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch((error) => {
    console.log("ERROR:", error.message || error);
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
app.get("/db", (_, res) => {
  query = "SELECT * FROM users";
  db.tx(async (t) => {
    const users = await t.manyOrNone("SELECT * FROM users");
    const groups = await t.manyOrNone("SELECT * FROM groups");

    return { users, groups };
  })
    .then((data) => {
      queries = {
        users: data.users,
        groups: data.groups,
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
  // res.redirect('/login'); //this will call the /anotherRoute route in the API
});

app.get("/login", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;
  res.render("pages/login", { message: errorMessage || message });
});

app.get("/register", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;
  res.render("pages/register", { message: errorMessage || message });
});

// Register
app.post("/register", async (req, res) => {
  db.tx(async (t) => {
    const user = await t.oneOrNone(
      `SELECT * FROM users WHERE users.username = $1`,
      req.body.username
    );

    if (user) {
      throw new Error(`User ${req.body.username} already exists!`);
    }
  }).catch((e) => {
    console.log(e);
    res.redirect("/login?error=" + encodeURIComponent(e.message));
  });
  // hash the password using bcrypt library
  const hash = await bcrypt.hash(req.body.password, 10);
  try {
    await db.none("INSERT INTO users(username, password) VALUES ($1, $2);", [
      req.body.username,
      hash,
    ]);

    res.redirect(
      "/login?message=" + encodeURIComponent("Successfully registered!")
    );
  } catch (e) {
    console.log(e);
    // res.redirect("/register");
    res.redirect("/register?error=" + encodeURIComponent(e.message));
  }
});

app.post("/login", async (req, res) => {
  db.tx(async (t) => {
    // check if password from request matches with password in DB
    const user = await t.oneOrNone(
      `SELECT * FROM users WHERE users.username = $1`,
      req.body.username
    );

    if (!user) {
      throw new Error(`User ${req.body.username} not found in database.`);
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      throw new Error(`The password entered is incorrect.`);
    }
    req.session.user = user;
    req.session.save();
    res.redirect("/home");
  }).catch((err) => {
    console.log(err);
    res.redirect("/login?error=" + encodeURIComponent(err.message));
  });
  // const [user] = await db.tx(async t => {
  // 	return t.any(
  // 		`SELECT * FROM users WHERE username = '${req.body.username}'`,
  // 	);
  // })

  // if (user?.username) {
  // 	const match = await bcrypt.compare(req.body.password, user.password);

  // 	if (match) {
  // 		req.session.user = user;
  // 		req.session.save();
  // 		res.redirect('/home');
  // 	}
  // 	else {
  // 		res.render('pages/login', {
  // 			message: "Incorrect username or password.",
  // 		});
  // 	}
  // }
  // else {
  // 	res.redirect('/register');
  // }
});

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect("/login");
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
    });
  } else {
    res.redirect("/login", { message: "Please login to access this page." });
  }
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
