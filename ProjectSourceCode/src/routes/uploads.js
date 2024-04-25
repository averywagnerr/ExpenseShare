const express = require("express");
const { bcrypt, db } = require("../resources/js/initdata");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const mindee = require("mindee");
const fs = require("fs");
const Router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploadStorage = multer({ storage: storage });

Router.post("/upload", uploadStorage.single("file"), (req, res) => {
  console.log(req.file);

  const mindeeClient = new mindee.Client({ apiKey: process.env.API_KEY });

  // Load a file from disk
  const path = req.file.path;
  const inputSource = mindeeClient.docFromPath(path);

  // Parse the file
  const apiResponse = mindeeClient.parse(mindee.product.ReceiptV5, inputSource);

  // Handle the response Promise
  apiResponse.then((resp) => {
    // print a string summary
    console.log(resp.document.toString());
    var supplier_name = "";
    var purchase_subcategory = "";
    var total_amount = "";
    var reciept_parts = resp.document.toString().split(":");
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

    try {
      fs.unlinkSync(path);
      console.log("File deleted!");
    } catch (err) {
      // Handle specific error if any
      console.error(err.message);
    }

    db.tx(async (t) => {
      await db
        .one(
          "INSERT INTO reciept_transactions (sender, receiver, amount, description) VALUES ($1, $2, $3, $4) RETURNING id",
          [
            req.session.user.username,
            supplier_name,
            total_amount,
            purchase_subcategory,
          ]
        )
        .then((data) => {
          console.log("Transaction data: ", data);
          db.none(
            "INSERT INTO user_to_reciept_transactions (username, transaction_id) VALUES ($1, $2)",
            [req.session.user.username, data.id]
          );
        })
        .catch((err) => {
          console.error(err);
          res.render("pages/home", {
            message: "An error occurred while uploading your reciept data.",
            error: true,
          });
          return;
        });
    });
  });

  const reciept_transactions = db
    .manyOrNone(
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
          res.render("pages/home", {
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

  return;
});

module.exports = Router;
