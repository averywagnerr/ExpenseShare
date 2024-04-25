const express = require("express");
const ShortUniqueId = require("short-unique-id");
// const { randomUUID } = new ShortUniqueId({ length: 10 });
const { bcrypt, db } = require("../resources/js/initdata");

const Router = express.Router();

async function getGroups(req, res) {
  try {
    const groups = await db.manyOrNone(
      `SELECT g.groupname, g.token, ARRAY_AGG(u.username) AS members
       FROM groups g
       INNER JOIN user_to_groups utg ON g.token = utg.token AND g.groupname = utg.groupname
       INNER JOIN users u ON utg.username = u.username
       WHERE utg.username = $1
       GROUP BY g.groupname, g.token`,
      [req.session.user.username]
    );
    groups.forEach((g) => {
      console.log(`Group Name:`, g.groupname);
      console.log(`Members:`, g.members);
    });
    return groups;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

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

Router.get("/getGroups", async (req, res) => {
  try {
    const groups = await getGroups(req);
    res.json(groups);
  } catch (error) {
    res.status(500).send();
  }
});

Router.get("/joinGroup", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;

  res.render("pages/joinGroup", { message: errorMessage || message });
});

Router.get("/createGroup", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;

  res.render("pages/createGroup", { message: errorMessage || message });
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

      console.log(`groupname: ${req.body.groupname}`);

      // Hash the joincode using bcrypt library
      const hash = await bcrypt.hash(toString(token), 10);

      await t
        .none("INSERT INTO groups(token, groupname) VALUES ($1, $2);", [
          hash,
          req.body.groupname,
        ])
        .then((r) => {
          t.none(
            "INSERT INTO user_to_groups (username, token, groupname) VALUES ($1, $2, $3)",
            [req.session.user.username, hash, req.body.groupname]
          );
        });

      const groups = await getGroups(req);
			req.session.user.groups = groups;


      res.render("pages/home", {
        message: `Successfully created group!`,
        user: req.session.user,
        username: req.session.user.username,
        groups: req.session.user.groups,
        balance: req.session.user.balance,
      });

      // res.send({ message: "Successfully created group!"})
      // Redirect to the home page with a success message
      // res.render("pages/home", { message: "Successfully created group!" });
    });
  } catch (e) {
    console.error(e);
    res.status(500).render("pages/home", { message: e.message });
  }
});

// * ================ Join Group ================ * //

Router.get("/joinGroup", (req, res) => {
  // if (!req.session.user) {
  //   return res.redirect("/login");
  // }

  let errorMessage = req.query.error;
  let message = req.query.message;
  res.render("pages/joinGroup", {
    message: errorMessage || message,
    error: errorMessage,
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
      res.render("pages/joinGroup", {
        error: `The group ${req.body.groupname} not found in database.`,
      });
      return;
    }

    // check if tokens match (PK ?)
    const match = await bcrypt.compare(req.body.token, group.token);

    if (!match) {
      res.status(400);
      res.render("pages/joinGroup", {
        error: `The join code entered is incorrect.`,
      });
      return;
    }

    // first check that user is not already in group
    const check = await t.oneOrNone(
      "SELECT * FROM user_to_groups WHERE username = $1 AND groupname = $2",
      [req.session.user.username, req.body.groupname]
    );
    if (check) {
      res.status(400);
      res.render("pages/joinGroup", {
        error: `You are already a member of this group.`,
      });
      return;
    }

    await t.none(
      "INSERT INTO user_to_groups (username, token, groupname) VALUES ($1, $2, $3)",
      [req.session.user.username, group.token, req.body.groupname]
    );
    // let groups = [];

    // const groups = getGroups(req);

    const groups = await getGroups(req, res);
    req.session.user.groups = groups;

    res.render("pages/home", {
      message: `Succesfully joined ${req.body.groupname}!`,
      user: req.session.user,
      username: req.session.user.username,
      groups: req.session.user.groups,
      balance: req.session.user.balance,
    });
  }).catch((err) => {
    console.error(err);
    // res.status(err.status);
    // res.render("pages/joinGroup", { message: err.message });
    console.error(err);
    res.status(500).render("pages/joinGroup", {
      message:
        "An error occurred while joining the group. Please try again later.",
    });
    // res.redirect("/login?error=" + encodeURIComponent(err.message));
  });
});

module.exports = { Router, getGroups };
