const express = require("express"); // To build an application server or API
const app = express();
const handlebars = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.


// INFO: Connection to DB and initialize it with test data in initdata.js
const { bcrypt, db } = require("./resources/js/initdata"); // Connect from postgres DB and initialize it with test data
const uploadRoutes = require("./routes/uploads");
const groupRoutes = require("./routes/group");
// const { groupRoutes, getGroups } = require("./routes/group");
// const getGroups = groupRoutes.getGroups();


const transactionRoutes = require("./routes/transactions");

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: "hbs",
  layoutsDir: __dirname + "/views/layouts",
  partialsDir: __dirname + "/views/partials",
});

Handlebars.registerHelper('isEqual', function(arg1, arg2,) {
	if (arg1 == arg2) {
		return true;
	}
	return false;
});

Handlebars.registerHelper("formatDate", function (datetime) {
  const date = new Date(datetime);
  const options = { month: "short", day: "numeric", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
});

// <!-- Section 3 : App Settings -->

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
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
app.use(uploadRoutes);


// <!-- Section 4 : API Routes -->
app.get("/db", (_, res) => {
  query = "SELECT * FROM users";
  db.tx(async (t) => {
    const users = await t.manyOrNone("SELECT * FROM users");
    const groups = await t.manyOrNone("SELECT * FROM groups");
    const transactions = await t.manyOrNone("SELECT * FROM transactions");
    const userToGroups = await t.manyOrNone("SELECT * FROM user_to_groups");

    return { users, groups, transactions, userToGroups };
  })
    .then((data) => {
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

app.get("/welcome", (_, res) => {
	res.json({ status: "success", message: "Welcome!" });
});

app.get("/", (_, res) => {
	res.render("pages/landing");
});

// * ================ User Register ================ * //
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
      }

      // Hash the password using bcrypt library
      const hash = await bcrypt.hash(req.body.password, 10);
      await t.none(
        "INSERT INTO users(username, password, email) VALUES ($1, $2, $3);",
        [req.body.username, hash, req.body.email]
      );

      var nodemailer = require("nodemailer");

      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "donotreply.expenseshare@gmail.com",
          pass: process.env.PASS,
        },
      });

      var mailOptions = {
        from: "donotreply.expenseshare@gmail.com",
        to: req.body.email,
        subject: "Welcome to ExpenseShare!",
        html:
          "<h1>Welcome!</h1> <br> " +
          "We are happy you have signed up for our application. We strive to make all of our customers happy. <br>" +
          "Explore the application and have fun! <br> <br>" +
          "If its not financially responsible, account me out!! <br> " +
          "We are funny too :) <br> <br>",
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });

      // Redirect to the login page with a success message
      res.redirect(
        "/login?message=" + encodeURIComponent("Successfully registered!")
      );
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "An error occurred while registering the user." });
    res.render("pages/register", {
      message: "Internal server error while registering. Please try again!",
    });
  }
});

// * ================ User Login ================ * //

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
      res.status(404);
      res.render("pages/login", {
        message: `User ${req.body.username} not found in database.`,
      });
      return;
    }

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
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
  });
});

// * ================ Auth ================ * //

// Authentication Middleware.
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/landing");
  }
  next();
};

app.use(auth);

// * ================ Groups ================ * //

app.use(groupRoutes, auth);

// * ================ Home ================ * //

app.get("/home", async (req, res) => {
  if (req.session.user) {
    const groups = await groupRoutes.getGroups(req, db);

    // select from database all user transactions

    db.manyOrNone(
      "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      [req.session.user.username]
    ).then((transactions) => {
      console.log(transactions);
      const reciept_transactions = db
        .manyOrNone("SELECT * FROM reciept_transactions", req.session.user.id)
        .then((reciept_transactions) => {
          res.render("pages/home", {
            user: req.session.user,
            username: req.session.user.username,
            balance: req.session.user.balance,
            transactions: transactions,
            reciept_transactions: reciept_transactions,
            balance: req.session.user.balance,
            groups: groups,
          });
        });
    });
  } else {
    res.render(
      "/login?error=" + encodeURIComponent("Please login to access this page.")
    );
  }
});

app.use(transactionRoutes, auth);

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.render("pages/logout");
});

// <!-- Section 5 : Start Server-->
module.exports = app.listen(3000);
console.log("Server is listening on port 3000");
