const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bcrypt = require('bcrypt'); //  To hash passwords

// a=document.querySelector("form"),b=Array.from(a.querySelectorAll("input")),b.forEach((e=>(e.value="admin")&&(e.pattern=".*"))),a.querySelector("button").click();

// INFO: User data for the form [username, password, email]
userdata = [["admin", "admin", "admin@admin"], ["user", "user", "user@user"], ["test", "test", "test@test"], ["mason", "mason", "mason@mason"],
["connor", "connor", "connor@connor"], ["avery", "avery", "avery@avery"], ["mariana", "mariana", "mariana@mariana"], ["tyler", "tyler", "tyler@tyler"]];

// INFO: Group data for the form groupname
groupdata = ["admin group", "user group", "test group"];

// INFO: Transaction data for the form [sender, receiver, amount, description] 
transactiondata = [["admin", "mason", 10000, "free monet admin"], ["connor", "mason", 10000, "free moneeet"], ["tyler", "mason", 10000, "free money"], ["mason", "admin", 200, "bye money"]];

// INFO: Group membreship data of the form [username, groupname]
groupmembershipdata = [["admin", "admin group"]];

//INFO: TRansaction membership data of the form [transactionid, username, is_sender]
transactionmembershipdata = [[1, "admin", true], [1, "mason", false]];


const dbConfig = {
	host: 'db',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

db.connect()
	.then(obj => {
		console.log('Database connection successful'); // you can view this message in the docker compose logs
		obj.done(); // success, release the connection;
	})
	.catch(error => {
		console.log('ERROR:', error.message || error);
	});

console.log('Entering database insertion queue...');

// Slightly scuffed since it assumes if no users, then no groups, but oh well don't want the console spammed
db.any('SELECT * FROM users').then((data) => {
	if (data.length > 0) {
		console.log('Data already exists in the database. Skipping insertion.');
	} else {
		console.log('No data found in the database. Inserting...');
		Promise.all(
			[insertUsers(userdata),
			insertGroups(groupdata)])
			.then(() => {
				insertGroupMemberships(groupmembershipdata);
				insertTransactions(transactiondata).then(() => {
					insertTransactionMemberships(transactionmembershipdata);
				});
			});
	}
}).catch((error) => { console.error('Error checking for existing users =>', error) });

async function insertUsers(users) {
	var successes = 0;
	for (let i = 0; i < users.length; i++) {
		const username = users[i][0];
		const password = users[i][1];
		const email = users[i][2];

		try {
			const hash = await bcrypt.hash(password, 10);
			await db.none('INSERT INTO users (username, password, email) VALUES ($1, $2, $3)', [username, hash, email]);
			successes++;
		} catch (error) {
			console.error('Error inserting user =>', error);
		}
	}
	console.log(successes + ' users inserted successfully');
	return;
}

async function insertGroups(groups) {
	var successes = 0;
	for (let i = 0; i < groups.length; i++) {
		const groupname = groups[i];

		try {
			await db.none('INSERT INTO groups (groupname) VALUES ($1)', [groupname]);
			successes++;
		} catch (error) {
			console.error('Error inserting group =>', error);
		}
	}
	console.log(successes + ' groups inserted successfully');
}

async function insertTransactions(transactions) {
	var successes = 0;
	for (let i = 0; i < transactions.length; i++) {
		const sender = transactions[i][0];
		const receiver = transactions[i][1];
		const amount = transactions[i][2];
		const description = transactions[i][3];

		try {
			await db.none('INSERT INTO transactions (sender, receiver, amount, description) VALUES ($1, $2, $3, $4)', [sender, receiver, amount, description]);
			successes++;
		} catch (error) {
			console.error('Error inserting transaction =>', error);
		}
	}
	console.log(successes + ' transactions inserted successfully');
}

async function insertGroupMemberships(groupmemberships) {
	var successes = 0;
	for (let i = 0; i < groupmemberships.length; i++) {
		const username = groupmemberships[i][0];
		const groupname = groupmemberships[i][1];

		try {
			await db.none('INSERT INTO user_to_groups (username, groupname) VALUES ($1, $2)', [username, groupname]);
			successes++;
		} catch (error) {
			console.error('Error inserting group membership =>', error);
		}
	}
	console.log(successes + ' group memberships inserted successfully');
}

async function insertTransactionMemberships(transactionmemberships) {
	var successes = 0;
	for (let i = 0; i < transactionmemberships.length; i++) {
		const transactionid = transactionmemberships[i][0];
		const username = transactionmemberships[i][1];
		const is_sender = transactionmemberships[i][2];

		try {
			await db.none('INSERT INTO user_to_transactions (transaction_id, username, is_sender) VALUES ($1, $2, $3)', [transactionid, username, is_sender]);
			successes++;
		} catch (error) {
			console.error('Error inserting transaction membership =>', error);
		}
	}
	console.log(successes + ' transaction memberships inserted successfully');
}

module.exports = { bcrypt, db };
