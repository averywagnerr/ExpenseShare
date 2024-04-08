const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bcrypt = require('bcrypt'); //  To hash passwords

// INFO: User data for the form [username, password]
userdata = [["admin", "admin"], ["user", "user"], ["test", "test"], ["mason", "mason"],
["connor", "connor"], ["avery", "avery"], ["mariana", "mariana"], ["tyler", "tyler"]];

// INFO: Group data for the form [groupname]
groupdata = ["admin group", "user group", "test group"];

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

db.any('SELECT * FROM users').then((data) => {
	if (data.length > 0) {
		console.log('Users already exist in the database. Skipping insertion.');
	} else {
		console.log('No users found in the database. Inserting...');
		insertUsers(userdata);
	}
}).catch((error) => { console.error('Error checking for existing users =>', error) });

db.any('SELECT * FROM groups').then((data) => {
	if (data.length > 0) {
		console.log('Groups already exist in the database. Skipping insertion.');
	} else {
		console.log('No groups found in the database. Inserting...');
		insertGroups(groupdata);
	}
}).catch((error) => { console.error('Error checking for existing groups =>', error) });

async function insertUsers(users) {
	var successes = 0;
	for (let i = 0; i < users.length; i++) {
		const username = users[i][0];
		const password = users[i][1];

		try {
			const hash = await bcrypt.hash(password, 10);
			await db.none('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
			successes++;
		} catch (error) {
			console.error('Error inserting user =>', error);
		}
	}
	console.log(successes + ' users inserted successfully');
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

module.exports = { bcrypt, db };
