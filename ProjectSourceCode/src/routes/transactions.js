const express = require("express");
const ShortUniqueId = require("short-unique-id");
const { bcrypt, db } = require("../resources/js/initdata");

const session = require("express-session"); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const Router = express.Router();


Router.post("/deposit", async (req, res) => {
	try {
		console.log(req.body);

		let deposit = parseFloat(req.body.deposit_amount);
		let withdraw = parseFloat(req.body.withdraw_amount);

		let curr_balance = parseFloat(req.session.user.balance);

		let newBalance = curr_balance + (deposit - withdraw);

		newBalance = parseFloat(newBalance);

		const query = await db.none(
			`UPDATE users SET balance = ${newBalance} WHERE username = '${req.session.user.username}'`
		); //update user balance in database

		req.session.user.balance = newBalance;

		res.redirect("/home");

	} catch (err) {
		console.log(err);
		res.status(400).send();
	}
});

Router.post("/groupexpense", async function(req, res) {
	//INFO: Make sure the sender is in the group
	let inGroup = false;
	await db
		.oneOrNone(
			"SELECT * FROM user_to_groups WHERE username = $1 AND groupname = $2",
			[req.session.user.username, req.body.groupname]
		)
		.then((user) => {
			if (user) {
				inGroup = true;
			}
		})
		.catch((err) => {
			console.error(err);
			res.render("pages/home", {
				message: "An error occurred while validating group membership.",
				error: true,
			});
			return;
		});

	if (!inGroup) {
		res.render("pages/home", {
			message: "You are not in the group or this group does not exist!",
			error: true,
		});
		return;
	}

	let members = [];
	await db
		.manyOrNone(
			"SELECT username FROM user_to_groups WHERE groupname = $1",
			req.body.groupname
		)
		.then((users) => {
			users.forEach((user) => {
				console.log("User: ", user);
				members.push(user.username);
			});
		})
		.catch((err) => {
			console.error(err);
			res.render("pages/home", {
				message: "An error occurred while fetching group members.",
				error: true,
			});
			return;
		});

	for (let i = 0; i < members.length; i++) {
		if (members[i] !== req.session.user.username) {
			await db
				.one(
					"INSERT INTO transactions (sender, receiver, amount, description) VALUES ($1, $2, $3, $4) RETURNING id",
					[
						req.session.user.username,
						members[i],
						req.body.expenseamount / members.length,
						req.body.description,
					]
				)
				.then((data) => {
					console.log("Transaction data: ", data);
					db.none(
						"INSERT INTO user_to_transactions (username, transaction_id, is_sender) VALUES ($1, $2, $3)",
						[members[i], data.id, false]
					);
				})
				.catch((err) => {
					console.error(err);
					res.render("pages/home", {
						message: "An error occurred while adding group expense.",
						error: true,
					});
					return;
				});
		}
	}

	res.redirect("/home");
});

module.exports = Router;
