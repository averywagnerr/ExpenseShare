const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bcrypt = require('bcrypt'); //  To hash passwords

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

userdata = [["admin", "admin"], ["user", "user"], ["test", "test"], ["mason", "mason"],
["connor", "connor"], ["avery", "avery"], ["mariana", "mariana"], ["tyler", "tyler"]];

db.any('SELECT * FROM users').then((data) => {
	if (data.length > 0) {
		console.log('Users already exist in the database. Skipping insertion.');
	} else {
		console.log('No users found in the database. Inserting test data.');
		insertUsers(userdata);
	}
}).catch((error) => { console.error('Error checking for existing users =>', error) });

function insertUsers(users) {
	for (let i = 0; i < users.length; i++) {
		const username = users[i][0];
		const password = users[i][1];
		bcrypt.hash(password, 10, (err, hash) => {
			if (err) {
				console.error('Error hashing password for ' + username, err);
				return;
			}
			db.none('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash])
				.then(() => {
					console.log('User inserted successfully');
				})
				.catch((error) => {
					console.error('Error inserting user:', error);
				});
		})
	}
}

module.exports = { bcrypt, db };
