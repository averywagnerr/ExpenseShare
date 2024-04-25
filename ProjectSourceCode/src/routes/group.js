const express = require("express");
const axios = require("axios");
// const jwt = require('jsonwebtoken');
const ShortUniqueId = require("short-unique-id");
// const { randomUUID } = new ShortUniqueId({ length: 10 });
const { bcrypt, db, randomUUID } = require("../resources/js/initdata");

const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const Router = express.Router();

// let Group = require('../models/group');

Router.get("/joinGroup", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;

  const reciept_transactions = db
    .manyOrNone(
      // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      "SELECT * FROM reciept_transactions",
      req.session.user.id
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups",
        req.session.user.id
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          "SELECT * FROM transactions",
          req.session.user.id
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
          "SELECT * FROM deposit_withdrawl",
          req.session.user.id
          )
          .then((deposit_withdrawl) => {
          res.render("../views/pages/joinGroup", {
            user: req.session.user,
            groups: groups,
            deposit_withdrawl: deposit_withdrawl,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            message: errorMessage || message,
            balance: req.session.user.balance,
          });
        });
      });
    });
  });
});

Router.get("/createGroup", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;

  const reciept_transactions = db
    .manyOrNone(
      // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      "SELECT * FROM reciept_transactions",
      req.session.user.id
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups",
        req.session.user.id
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          "SELECT * FROM transactions",
          req.session.user.id
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
          "SELECT * FROM deposit_withdrawl",
          req.session.user.id
          )
          .then((deposit_withdrawl) => {
          res.render("../views/pages/createGroup", {
            user: req.session.user,
            groups: groups,
            deposit_withdrawl: deposit_withdrawl,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            message: errorMessage || message,
            balance: req.session.user.balance,
          });
        });
      });
    });
  });
});

// * ================ Create Group ================ * //

Router.post("/createGroup", async (req, res) => {
  // Randomly generate a 10-char group token.
  // const token = randomUUID();
  const token = new ShortUniqueId({ length: 10 });

  try {
    await db.tx(async (t) => {
      const group = await t.oneOrNone(
        `SELECT * FROM groups WHERE groups.groupname = $1`,
        req.body.groupname
      );
      if(group)
      {
        const reciept_transactions = db
        .manyOrNone(
          // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          "SELECT * FROM reciept_transactions",
          req.session.user.id
        )
        .then((reciept_transactions) => {
          const transactions = db
            .manyOrNone(
              // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
              "SELECT * FROM transactions",
              req.session.user.id
            )
            .then((transactions) => {
              const deposit_withdrawl = db
              .manyOrNone(
              "SELECT * FROM deposit_withdrawl",
              req.session.user.id
              )
              .then((deposit_withdrawl) => {
              res.render("../views/pages/joinGroup", {
                user: req.session.user,
                username: req.session.user.username,
                deposit_withdrawl: deposit_withdrawl,
                reciept_transactions: reciept_transactions,
                transactions: transactions,
                message: "Group already exists",
                balance: req.session.user.balance,
              });
            });
          });
        });
        return;
      }

      console.log(`groupname: ${req.body.groupname}`);


      await t.none("INSERT INTO groups(groupname) VALUES ($1);", [
        req.body.groupname,
      ]);
      await t.none("INSERT INTO user_to_groups(username,groupname) VALUES ($1, $2);", [
        req.session.user.username,
        req.body.groupname,
      ]);
     
      // res.send({ message: "Successfully created group!"})
      // Redirect to the home page with a success message
      const reciept_transactions = db
    .manyOrNone(
      // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      "SELECT * FROM reciept_transactions",
      req.session.user.id
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups",
        req.session.user.id
      )
      .then((groups) => {
        const transactions = db
          .manyOrNone(
            // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
            "SELECT * FROM transactions",
            req.session.user.id
          )
          .then((transactions) => {
            const deposit_withdrawl = db
            .manyOrNone(
            "SELECT * FROM deposit_withdrawl",
            req.session.user.id
            )
            .then((deposit_withdrawl) => {
            res.render("../views/pages/home", {
              user: req.session.user,
              groups: groups,
              deposit_withdrawl: deposit_withdrawl,
              username: req.session.user.username,
              reciept_transactions: reciept_transactions,
              transactions: transactions,
              message: "Successfully created group!",
              balance: req.session.user.balance,
            });
          });
        });
      });
    });
    });
  } catch (e) {
    console.error(e);
    res.status(e.status);
    const reciept_transactions = db
    .manyOrNone(
      // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      "SELECT * FROM reciept_transactions",
      req.session.user.id
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups",
        req.session.user.id
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          "SELECT * FROM transactions",
          req.session.user.id
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
          "SELECT * FROM deposit_withdrawl",
          req.session.user.id
          )
          .then((deposit_withdrawl) => {
          res.render("../views/pages/createGroup", {
            user: req.session.user,
            groups: groups,
            deposit_withdrawl: deposit_withdrawl,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            message: e.message,
            balance: req.session.user.balance,
          });
        });
      });
    });
  });
  }
});

// * ================ Join Group ================ * //

Router.get("/joinGroup", (req, res) => {
  // if (!req.session.user) {
  //   return res.redirect("/login");
  // }

  let errorMessage = req.query.error;
  let message = req.query.message;

  const reciept_transactions = db
    .manyOrNone(
      // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      "SELECT * FROM reciept_transactions",
      req.session.user.id
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups",
        req.session.user.id
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          "SELECT * FROM transactions",
          req.session.user.id
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
          "SELECT * FROM deposit_withdrawl",
          req.session.user.id
          )
          .then((deposit_withdrawl) => {
          res.render("../views/pages/joinGroup", {
            user: req.session.user,
            groups: groups,
            deposit_withdrawl: deposit_withdrawl,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            message: errorMessage || message,
            error: errorMessage,
            balance: req.session.user.balance,
          });
        });
      });
    });
  });
});

Router.post("/joinGroup", async (req, res) => {
  // let tokenRegex = /^.{10}$/;
  // if (!tokenRegex.test(req.body.token)) {
  //   res.status(400);
  //   res.render("pages/joinGroup", {
  //     message: "Invalid join code. Code must be 10 characters long.",
  //   });
  //   return;
  // }

  db.tx(async (t) => {
    // Check if name from request matches with name in DB
    const group = await t.oneOrNone(
      `SELECT * FROM groups WHERE groups.groupname = $1`,
      req.body.groupname
    );
    if (!group) {
      res.status(404);
      const reciept_transactions = db
    .manyOrNone(
      // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      "SELECT * FROM reciept_transactions",
      req.session.user.id
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups",
        req.session.user.id
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          "SELECT * FROM transactions",
          req.session.user.id
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
          "SELECT * FROM deposit_withdrawl",
          req.session.user.id
          )
          .then((deposit_withdrawl) => {
          res.render("../views/pages/createGroup", {
            user: req.session.user,
            groups: groups,
            deposit_withdrawl: deposit_withdrawl,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            message: "Group not found in database, please create a group.",
            balance: req.session.user.balance,
          });
        });
      });
    });
    });
      return;
    }

    await t.none("INSERT INTO user_to_groups(username,groupname) VALUES ($1, $2);", [
      req.session.user.username,
      req.body.groupname,
    ]);

    const reciept_transactions = db
    .manyOrNone(
      // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      "SELECT * FROM reciept_transactions",
      req.session.user.id
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups",
        req.session.user.id
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          "SELECT * FROM transactions",
          req.session.user.id
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
          "SELECT * FROM deposit_withdrawl",
          req.session.user.id
          )
          .then((deposit_withdrawl) => {
          res.render("../views/pages/home", {
            message: "Successfully joined group!",
            user: req.session.user,
            groups: groups,
            deposit_withdrawl: deposit_withdrawl,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            balance: req.session.user.balance,
          });
        });
      });
      });
    });
    // let groups = [req.session.user.groups];
    // groups.append(group);
    // req.session.save();
    // res.redirect(302, "/home");
    // res.send({message: "WOOOO"})
  }).catch((err) => {
    console.error(err);
    // res.status(err.status);
    // res.render("pages/joinGroup", { message: err.message });
    console.error(err);
    const reciept_transactions = db
    .manyOrNone(
      // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      "SELECT * FROM reciept_transactions",
      req.session.user.id
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups",
        req.session.user.id
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          "SELECT * FROM transactions",
          req.session.user.id
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
          "SELECT * FROM deposit_withdrawl",
          req.session.user.id
          )
          .then((deposit_withdrawl) => {
          res.render("../views/pages/home", {
            user: req.session.user,
            groups: groups,
            deposit_withdrawl: deposit_withdrawl,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            message: "You already joined this group.",
            balance: req.session.user.balance,
          });
        });
      });
      });
    });
    // res.redirect("/login?error=" + encodeURIComponent(err.message));
  });
});



Router.post("/members", async (req, res) => {
	try {
		// await db.tx(async (t) => {
		// 	const members = await t.oneOrNone(
		// 		`SELECT * FROM user_to_groups WHERE groupname = $1`,
		// 		req.body.group_name
		// 	);
    // });

    const reciept_transactions = db
    .manyOrNone(
      // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
      "SELECT * FROM reciept_transactions",
      req.session.user.id
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups",
        req.session.user.id
      )
      .then((groups) => {
        const members = db
      .manyOrNone(
        // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
        "SELECT * FROM user_to_groups WHERE groupname = $1",
        req.body.group_name
      )
      .then((members) => {
      const transactions = db
        .manyOrNone(
          // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          "SELECT * FROM transactions",
          req.session.user.id
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
          "SELECT * FROM deposit_withdrawl",
          req.session.user.id
          )
          .then((deposit_withdrawl) => {
          res.render("../views/pages/home", {
            user: req.session.user,
            groups: groups,
            members: members,
            deposit_withdrawl: deposit_withdrawl,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            balance: req.session.user.balance,
          });
        });
      });
      });
    });
    });

	} catch (err) {
		console.log(err);
		res.status(400).send();
	}
  return;
});

module.exports = Router;
