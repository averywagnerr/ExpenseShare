CREATE TABLE IF NOT EXISTS users (
		username VARCHAR(50) PRIMARY KEY,
		password VARCHAR(60) NOT NULL,
		balance DECIMAL(10, 2) DEFAULT 0
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

-- CREATE VIEW user_transactions AS
-- SELECT t.id, t.amount, t.description, t.created_at
-- 	FROM transactions t
-- 	JOIN user_to_transactions ut ON t.id = ut.transaction_id
-- 	WHERE ut.username = ?;
