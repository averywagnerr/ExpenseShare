CREATE TABLE IF NOT EXISTS users (
		username VARCHAR(50) PRIMARY KEY,
		password VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
		name VARCHAR(255) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS transactions (
		id SERIAL PRIMARY KEY,
		amount DECIMAL(10, 2) NOT NULL,
		description TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_to_groups (
	username VARCHAR(50) REFERENCES users,
	groupname VARCHAR(255) REFERENCES groups,
	PRIMARY KEY (username, groupname)
);

CREATE TABLE IF NOT EXISTS user_to_transactions (
	username VARCHAR(255) REFERENCES users,
	transaction_id INT REFERENCES transactions,
	PRIMARY KEY (username, transaction_id)
);

--TODO: Potentially add views to simplify queries
