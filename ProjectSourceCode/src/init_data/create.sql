CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) NOT NULL,
		password VARCHAR(255) NOT NULL
);
-- DROP TABLE IF EXISTS users;
-- CREATE TABLE users (
--   username VARCHAR(50) PRIMARY KEY,
--   password CHAR(60) NOT NULL
-- );

-- CREATE TABLE IF NOT EXISTS groups (
-- 		id SERIAL PRIMARY KEY,
-- 		name VARCHAR(255) NOT NULL,
-- 		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
--
-- CREATE TABLE IF NOT EXISTS user_to_groups (
-- 	foreign_key user_id REFERENCES users(id),
-- 	foreign_key group_id REFERENCES groups(id)
-- );
--
-- CREATE TABLE IF NOT EXISTS user_to_transactions (
-- 	foreign_key user_id REFERENCES users(id),
-- 	foreign_key transaction_id REFERENCES transactions(id)
-- );
--
-- CREATE TABLE IF NOT EXISTS transactions (
-- 		id SERIAL PRIMARY KEY,
-- 		amount DECIMAL(10, 2) NOT NULL,
-- 		description TEXT NOT NULL,
-- 		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
--
-- --TODO: Potentially add views to simplify queries
