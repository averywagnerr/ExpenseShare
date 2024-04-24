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


      await t.none("INSERT INTO groups(groupname) VALUES ($1);", [
        req.body.groupname,
      ]);
      await t.none("INSERT INTO user_to_groups(username,groupname) VALUES ($1, $2);", [
        req.session.user.username,
        req.body.groupname,
      ]);
     
      // res.send({ message: "Successfully created group!"})
      // Redirect to the home page with a success message
      res.render(
        "../views/pages/home", { message: "Successfully created group!" }
      );
    });
  } catch (e) {
    console.error(e);
    res.status(e.status);
    res.render("pages/createGroup", { message: e.message });

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
      res.render("../views/pages/createGroup", {
        error: `The group ${req.body.groupname} not found in database.`,
      });
      return;
    }

    await t.none("INSERT INTO user_to_groups(username,groupname) VALUES ($1, $2);", [
      req.session.user.username,
      req.body.groupname,
    ]);
    res.render(
      "../views/pages/home", { message: "Successfully joined group!" }
    );
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
    res.status(500).render("pages/joinGroup", { 
      message: "An error occurred while joining the group. Please try again later."
    });
    // res.redirect("/login?error=" + encodeURIComponent(err.message));
  });
});

module.exports = Router;
