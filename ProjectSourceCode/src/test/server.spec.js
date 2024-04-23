// ********************** How to Test **********************************
/**
 * * Clear database before composing up `docker-compose down -v`
 * * Then, docker-compose up
 */


// process.env.NODE_ENV = 'test'

// ********************** Initialize server **********************************


const server = require("../index"); // TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require("chai"); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

// let User = require('../models/user.js') // TODO - create a User model

describe("Server!", () => {
	// Sample test case given to test / endpoint.
	it("Returns the default welcome message", (done) => {
		chai
			.request(server)
			.get("/welcome")
			.end((err, res) => {
				expect(res).to.have.status(200);
				expect(res.body.status).to.equals("success");
				assert.strictEqual(res.body.message, "Welcome!");
				done();
			});
	});
});

/*
 * Positive Testcase
 * API: /register
 * Input: { username: "testuser", password: "GoodPassword123!" }
 * Expect: res.status == 200
 * Result: This test case should pass and return a status 200
 * Explanation: The testcase will call the /register API with the following input and expects the API to return a status of 200.
 */

describe("Testing Register API", () => {
	it("Positive : /register", (done) => {
		chai
			.request(server)
			.post("/register")
			.send({ username: "testuser", password: "GoodPassword123!", email: "goodemail@email" })
			.end((err, res) => {
				expect(res).to.have.status(200);
				// expect(res.body.message).to.equals('Success');
				done();
			});
	});

	/*
	 * Example Negative Testcase :
	 * API: /register
	 * Input: {id: 5, name: 10, dob: '2020-02-20'}
	 * Expect: res.status == 400 and res.body.message == 'Invalid input'
	 * Result: This test case should pass and return a status 400 along with a "Invalid input" message.
	 * Explanation: The testcase will call the /register API with the following invalid inputs and expects the API to return a status of 400 along with the "Invalid input" message.
	 */
	it("Negative : /register. Checking duplicate name", (done) => {
		chai
			.request(server)
			.post("/register")
			.send({ username: "testuser", password: "Goodpassword123!", email: "goodemail@email" }) // require 8+ characters, uppercase letter, lowercase letter, and special char in password
			.end((err, res) => {
				expect(res).to.have.status(400);
				// expect(res.body.message).to.equals('Invalid input');
				done();
			});
	});

	/*
	 * Negative Testcase : Valid username, invalid password.
	 * API: /register
	 * Input: { username: "newuser", password: "1" }
	 * Expect: res.status == 400
	 * Result: This test case should pass and return a status 401.
	 * Explanation: The testcase will call the /register API with the following invalid password input and expects the API to return a status of 400
	 */
	it("Negative : /register. Checking invalid password", (done) => {
		chai
			.request(server)
			.post("/register")
			.send({ username: "newuser", password: "1", email: "email@email" }) // require 8+ characters, uppercase letter, lowercase letter, and special char in password
			.end((err, res) => {
				expect(res).to.have.status(400);
				// expect(res.body.message).to.equals('Invalid input');
				done();
			});
	});
	// });

	/* === Lab 11: 2 additional test cases === */

	// describe("Testing Login API", () => {
	/* 1.
	 * Positive Testcase : Valid login credentials.
	 * API: /login
	 * Input: { username: "testuser", password: "GoodPassword123!" }
	 * Expect: res.status == 302
	 * Result: This test case should pass and return a status 302.
	 * Explanation: The testcase will call the /login API with the following valid input and expects the API to return a status of 302
	 */
	it("Positive : /login", (done) => {
		chai
			.request(server)
			.post("/login")
			.send({ username: "testuser", password: "GoodPassword123!" })
			.end((err, res) => {
				expect(res).to.have.status(302);
				done();
			});
	});

	/* 2.
	 * Negative Testcase : Invalid username results in an error.
	 * API: /login
	 * Input: { username: "nulluser", password: "GoodPassword123!" }
	 * Expect: res.status == 404 (Not Found)
	 * Result: This test case should NOT pass and return a status 404.
	 * Explanation: The testcase will call the /login API with the following invalid input and expects the API to return a status of 404 (Not Found).
	 */
	it("Negative : /login. Checking for nonexistent user.", (done) => {
		chai
			.request(server)
			.post("/login")
			.send({ username: "nulluser", password: "GoodPassword123!" })
			.end((err, res) => {
				expect(res).to.have.status(404);
				done();
			});
	});
});

// ***************************** Group Tests ************************************

describe("Join & Create Groups",()  => {
	
	// TODO -- figure out test env 
	// it("Inputs a test group", async (done) => {
	// 	chai
	// 		.request(server)
	// 		.post("/createGroup")
	// 		.send({ groupname: "New Test Group"})
	// 		.end((err, res) => {
	// 			expect(res).to.have.status(302);
	// 			done();
	// 		});

		// const test_hash = await bcrypt.hash('testtoken', 10);

		// await server.none('INSERT INTO groups (token, groupname) VALUES ($1, $2)', [hash, groupname]);
	// })

	/* 
	 * Positive Case : A user can create a group by entering a group name.
	 * Route: /createGroup
	 * Input: { groupname: "New Test Group" }
	 * Expect: res.status == 302
	 */
	it("Positive : /createGroup", (done) => {
		chai
			.request(server)
			.post("/createGroup")
			.send({ groupname: "New Test Group"})
			.end((err, res) => {
				expect(res).to.have.status(302);
				done();
			});
	});

	/* 
	 * Positive Case : A user can join a group by entering a group name and join code.
	 * Route: /joinGroup
	 * Input: { groupname: "test group", token: "testtoken"}
	 * Expect: res.status == 302
	 */
	it("Positive : /joinGroup", (done) => {
		
		chai
			.request(server)
			.post("/joinGroup")
			.send({ groupname: "test group", token: "testtoken"})
			.end((err, res) => {
				expect(res).to.have.status(302);
				done();
			});
	});

	// TODO -- need test DB?
	/*  
	 * Negative Case : A user cannot join a group with an invalid join code.
	 * Route: /joinGroup
	 * Input: { groupname: "test group", token: "badtoken"}
	 * Expect: res.status == 400
	 */
	// it("Negative : /joinGroup", (done) => {
	// 	chai
	// 		.request(server)
	// 		.post("/joinGroup")
	// 		.send({ groupname: "test group", token: "badtoken"})
	// 		.end((err, res) => {
	// 			// expect(res.message).to.equal(`The join code entered is incorrect.`)
	// 			expect(res).to.have.status(400);
	// 			done();
	// 		});
	// });
});