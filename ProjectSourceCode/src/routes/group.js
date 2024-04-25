const express = require("express");
const ShortUniqueId = require("short-unique-id");
// const { randomUUID } = new ShortUniqueId({ length: 10 });
const { bcrypt, db } = require("../resources/js/initdata");

const Router = express.Router();

// async function getGroups(req, res) {
//   try {
//     const groups = await db.manyOrNone(
//       `SELECT g.groupname, g.token, ARRAY_AGG(u.username) AS members
//        FROM groups g
//        INNER JOIN user_to_groups utg ON g.token = utg.token AND g.groupname = utg.groupname
//        INNER JOIN users u ON utg.username = u.username
//        WHERE utg.username = $1
//        GROUP BY g.groupname, g.token`,
//       [req.session.user.username]
//     );
//     groups.forEach((g) => {
//       console.log(`Group Name:`, g.groupname);
//       console.log(`Members:`, g.members);
//     });
//     return groups;
//   } catch (e) {
//     console.error(e);
//     throw e;
//   }
// }

// async function getGroups(req, db) {
//   const groupname = req.body.groupname ? req.body.groupname : null;

//   const members = [];
//   const groups = [];
//   try {
//     const groups_res = await db
//       .manyOrNone(
//         "SELECT * FROM groups g JOIN user_to_groups ug ON g.token = ug.token WHERE ug.username = $1",
//         // "SELECT (groupname, token) FROM user_to_groups WHERE username = $1",
//         req.session.user.username
//       )
//       .then((groups_res) => {
//         groups_res.forEach((group) => {

//           console.log("Group: ", group);
//           if (!groupname) {
//             groupname = group.groupname;
//           }
//           const group_model = {
//             groupname: group.groupname,
//             token: group.token, // TODO : decrypt
//             members: members,
//           };

//           groups.push(group_model);
//         });
//       });

//       const users = db.manyOrNone(
// "SELECT * FROM groups g JOIN user_to_groups ug ON g.token = ug.token WHERE ug.groupname = $1",
//         // req.body.groupname
//         groupname
//       )
//       .then((users) => {
//         users.forEach((user) => {
//           console.log("User: ", user);
//           members.push(user.username);

//         });
//       });
//       // groups_res.forEach((group) => {
//         // const users = db.manyOrNone(
//         //   "SELECT * FROM groups g JOIN user_to_groups ug ON g.token = ug.token WHERE ug.groupname = $1",
//         //   // req.body.groupname
//         //   group.groupname
//         // );
//         // .then((users) => {
//         //   users.forEach((user) => {
//         //     console.log("User: ", user);
//         //     members.push(user.username);
//         //   });
//         // });
//         // users.forEach((u) => {
//         //   members.push(u.username);
//         // })

//       // });

//     return groups;
//   } catch (e) {
//     console.error(e);
//     // res.status(500).send();
//     throw e;
//   }
// };

// Router.get("/getGroups", async (req, res) => {
//   try {
//     const groups = await getGroups(req);
//     res.json(groups);
//   } catch (error) {
//     res.status(500).send();
//   }
// });

Router.get("/joinGroup", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;

  const reciept_transactions = db
    .manyOrNone(
      "SELECT * FROM reciept_transactions WHERE sender = $1",
      [req.session.user.username]
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE username = $1",
        [req.session.user.username]
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          [req.session.user.username]
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
          ).then((deposit_withdrawl) => {
          res.render("../views/pages/joinGroup", {
            user: req.session.user,
            groups: groups,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            deposit_withdrawl: deposit_withdrawl,
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
      "SELECT * FROM reciept_transactions WHERE sender = $1",
      [req.session.user.username]
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE username = $1",
        [req.session.user.username]
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          [req.session.user.username]
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
          ).then((deposit_withdrawl) => {
          res.render("../views/pages/createGroup", {
            user: req.session.user,
            groups: groups,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            message: errorMessage || message,
            deposit_withdrawl: deposit_withdrawl,
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
          "SELECT * FROM reciept_transactions WHERE sender = $1",
          [req.session.user.username]
        )
        .then((reciept_transactions) => {
          const transactions = db
            .manyOrNone(
              // "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
              "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
              [req.session.user.username]
            )
            .then((transactions) => {
              const deposit_withdrawl = db
            .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
            ).then((deposit_withdrawl) => {
            const groups = db
            .manyOrNone(
              "SELECT * FROM user_to_groups WHERE username = $1",
              [req.session.user.username]
            ).then((groups) => {
              res.render("../views/pages/joinGroup", {
                user: req.session.user,
                username: req.session.user.username,
                reciept_transactions: reciept_transactions,
                transactions: transactions,
                groups: groups,
                deposit_withdrawl: deposit_withdrawl,
                message: "Group already exists",
                balance: req.session.user.balance,
              });
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
      "SELECT * FROM reciept_transactions WHERE sender = $1",
      [req.session.user.username]
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE username = $1",
        [req.session.user.username]
      )
      .then((groups) => {
        const transactions = db
          .manyOrNone(
            "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
            [req.session.user.username]
          )
          .then((transactions) => {
            const deposit_withdrawl = db
          .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
          ).then((deposit_withdrawl) => {
            res.render("../views/pages/home", {
              user: req.session.user,
              groups: groups,
              username: req.session.user.username,
              reciept_transactions: reciept_transactions,
              transactions: transactions,
              deposit_withdrawl: deposit_withdrawl,
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
      "SELECT * FROM reciept_transactions WHERE sender = $1",
      [req.session.user.username]
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE username = $1",
        [req.session.user.username]
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          [req.session.user.username]
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
          ).then((deposit_withdrawl) => {
          res.render("../views/pages/createGroup", {
            user: req.session.user,
            groups: groups,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            message: e.message,
            deposit_withdrawl: deposit_withdrawl,
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
      "SELECT * FROM reciept_transactions WHERE sender = $1",
      [req.session.user.username]
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE username = $1",
        [req.session.user.username]
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          [req.session.user.username]
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
          ).then((deposit_withdrawl) => {
          res.render("../views/pages/joinGroup", {
            user: req.session.user,
            groups: groups,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            message: errorMessage || message,
            error: errorMessage,
            deposit_withdrawl: deposit_withdrawl,
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
      "SELECT * FROM reciept_transactions WHERE sender = $1",
      [req.session.user.username]
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE username = $1",
        [req.session.user.username]
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          [req.session.user.username]
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
          ).then((deposit_withdrawl) => {
          res.render("../views/pages/createGroup", {
            user: req.session.user,
            groups: groups,
            username: req.session.user.username,
            reciept_transactions: reciept_transactions,
            transactions: transactions,
            deposit_withdrawl: deposit_withdrawl,
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
      "SELECT * FROM reciept_transactions WHERE sender = $1",
      [req.session.user.username]
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE username = $1",
        [req.session.user.username]
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          [req.session.user.username]
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
          ).then((deposit_withdrawl) => {
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
      "SELECT * FROM reciept_transactions WHERE sender = $1",
      [req.session.user.username]
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE username = $1",
        [req.session.user.username]
      )
      .then((groups) => {
      const transactions = db
        .manyOrNone(
          "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          [req.session.user.username]
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
          ).then((deposit_withdrawl) => {
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
      "SELECT * FROM reciept_transactions WHERE sender = $1",
      [req.session.user.username]
    )
    .then((reciept_transactions) => {
      const groups = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE username = $1",
        [req.session.user.username]
      )
      .then((groups) => {
        const members = db
      .manyOrNone(
        "SELECT * FROM user_to_groups WHERE groupname = $1",
        req.body.group_name
      )
      .then((members) => {
      const transactions = db
        .manyOrNone(
          "SELECT * FROM transactions t JOIN user_to_transactions ut ON t.id = ut.transaction_id WHERE ut.username = $1",
          [req.session.user.username]
        )
        .then((transactions) => {
          const deposit_withdrawl = db
          .manyOrNone(
            "SELECT * FROM deposit_withdrawl WHERE sender = $1", 
            [req.session.user.username]
          ).then((deposit_withdrawl) => {
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
