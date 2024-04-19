CREATE TABLE IF NOT EXISTS users (
	username VARCHAR(50) PRIMARY KEY,
	password VARCHAR(60) NOT NULL,
	email VARCHAR(255) NOT NULL,
	balance DECIMAL(10, 2) DEFAULT 1000
);

CREATE TABLE IF NOT EXISTS groups (
	groupname VARCHAR(255) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  sender VARCHAR(50) REFERENCES users(username),
  receiver VARCHAR(50) REFERENCES users(username),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_to_groups (
	username VARCHAR(50) REFERENCES users(username),
	groupname VARCHAR(255) REFERENCES groups,
	PRIMARY KEY (username, groupname)
);

CREATE TABLE IF NOT EXISTS user_to_transactions (
	username VARCHAR(50) REFERENCES users,
	transaction_id INT REFERENCES transactions,
  is_sender BOOLEAN NOT NULL,
	PRIMARY KEY (username, transaction_id)
)

--TODO: Potentially add views to simplify queries

-- CREATE VIEW user_transactions AS
-- SELECT t.id, t.amount, t.description, t.created_at
-- 	FROM transactions t
-- 	JOIN user_to_transactions ut ON t.id = ut.transaction_id

--SELECT
--   t.id,
--   u1.username AS sender,
--   u2.username AS receiver,
--   t.amount,
--   t.description,
--   t.created_at
-- FROM
--   transactions t
--   JOIN users u1 ON t.sender = u1.username
--   JOIN users u2 ON t.receiver = u2.username
-- ORDER BY
--   t.created_at DESC; 	WHERE ut.username = ?;
