const express = require("express");
const axios = require("axios");

// const jwt = require('jsonwebtoken');
const { bcrypt, db } = require("../resources/js/initdata");

const ShortUniqueId = require("short-unique-id");

const Router = express.Router();

// let Group = require('../models/group');

const { randomUUID } = new ShortUniqueId({ length: 10 });

Router.get("/getGroup", (req, res) => {
  let errorMessage = req.query.error;
  let message = req.query.message;
  res.render("pages/joinGroup", { message: errorMessage || message });
});

/* ================ Create Group ================ */

Router.post("/createGroup", async (req, res) => {
  let tokenRegex = /^.{10}$/;
  if (!tokenRegex.test(req.body.joincode)) {
    res.status(400);
    res.render("pages/createGroup", {
      message: "Invalid join code. Code must be 8 characters long.",
    });
    return;
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

      // Redirect to the login page with a success message
      res.redirect(
        "/home?message=" + encodeURIComponent("Successfully created group!")
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
  let errorMessage = req.query.error;
  let message = req.query.message;
  res.render("pages/joinGroup", {
    message: errorMessage || message,
    error: errorMessage,
  });
});

Router.post("/joinGroup", async (req, res) => {
  db.tx(async (t) => {
    // First, check if tokens match (PK)
    const match = await bcrypt.compare(req.body.joincode, group.token);

    if (!match) {
      var err = new Error(`The join code entered is incorrect.`);
      err.status = 400;
      console.log(`Error: ${err.message}, ${err.status}`);
      throw err;
    }

    // Check if name from request matches with name in DB
    // TODO : should this check / input from user even be included
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

    // req.session.user = user;
    // req.session.save();
    res.redirect("/home");
  }).catch((err) => {
    console.error(err);
    res.status(err.status);
    res.render("pages/createGroup", { message: err.message });
    // res.redirect("/login?error=" + encodeURIComponent(err.message));
  });
});

module.exports = Router;
