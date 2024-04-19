const express = require("express");
const axios = require("axios");
// const jwt = require('jsonwebtoken');
const ShortUniqueId = require("short-unique-id");
// const { randomUUID } = new ShortUniqueId({ length: 10 });
const { bcrypt, db, randomUUID } = require("../resources/js/initdata");
const handlebars = require("express-handlebars");
const Handlebars = require("handlebars");
const path = require("path");
const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const Router = express.Router();
const hbs = handlebars.create({
  extname: "hbs",
  layoutsDir: __dirname + "/views/layouts",
  partialsDir: __dirname + "/views/partials",
});

// let Group = require('../models/group');

Router.get("/joinGroup", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;

  if (req.session.user) {
    res.render("pages/joinGroup", {
      user: req.session.user,
      username: req.session.user.username,
      message: errorMessage || message,
    });
  }

  // res.render("pages/joinGroup", { message: errorMessage || message });
});

Router.get("/createGroup", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;

  if (req.session.user) {
    res.render("pages/createGroup", {
      user: req.session.user,
      username: req.session.user.username,
      message: errorMessage || message,
    });
  }

  // res.render("pages/createGroup", { message: errorMessage || message });
});

/* ================ Create Group ================ */

Router.post("/createGroup", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/home");
  }

  // Randomly generate a 10-char group token.
  const token = randomUUID();

  try {
    await db.tx(async (t) => {
      const group = await t.oneOrNone(
        `SELECT * FROM groups WHERE groups.groupname = $1`,
        req.body.groupname
      );

      // Hash the joincode using bcrypt library
      const hash = await bcrypt.hash(token, 10);

      await t.none("INSERT INTO groups(token, groupname) VALUES ($1, $2);", [
        hash,
        req.body.groupname,
      ]);
      let groups = [req.session.user.groups];
      groups.append(group);
      req.session.save();
      // Redirect to the home page with a success message
      res.redirect(
        "/home?message=" + encodeURIComponent("Successfully created group!"),
        { user: req.session.user, username: req.session.user.username }
      );
    });
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: "An error occurred while creating the group." });
    res.render("pages/createGroup", {
      message: "Internal server error while creating group. Please try again!",
    });
  }
});

/* ================ Join Group ================ */

Router.get("/joinGroup", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  let errorMessage = req.query.error;
  let message = req.query.message;
  res.render("pages/joinGroup", {
    message: errorMessage || message,
    error: errorMessage,
  });
});

Router.post("/joinGroup", async (req, res) => {
  let tokenRegex = /^.{10}$/;
  if (!tokenRegex.test(req.body.token)) {
    res.status(400);
    res.render("pages/joinGroup", {
      message: "Invalid join code. Code must be 10 characters long.",
    });
    return;
  }

  db.tx(async (t) => {
    // Check if name from request matches with name in DB
    const group = await t.oneOrNone(
      `SELECT * FROM groups WHERE group.groupname = $1`,
      req.body.groupname
    );
    if (!group) {
      res.status(404);
      res.render("pages/joinGroup", {
        message: `The group ${req.body.groupname} not found in database.`,
      });
      return;
    }

    // check if tokens match (PK ?)
    const match = await bcrypt.compare(req.body.token, group.token);

    if (!match) {
      var err = new Error(`The join code entered is incorrect.`);
      err.status = 400;
      console.log(`Error: ${err.message}, ${err.status}`);
      throw err;
    }

    let groups = [req.session.user.groups];
    groups.append(group);
    req.session.save();
    res.redirect("/home", {
      user: req.session.user,
      username: req.session.user.username,
    });
  }).catch((err) => {
    console.error(err);
    res.status(err.status);
    res.render("pages/createGroup", { message: err.message });
    // res.redirect("/login?error=" + encodeURIComponent(err.message));
  });
});

module.exports = Router;
