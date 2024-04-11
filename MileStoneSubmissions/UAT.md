# UAT Plans

TODO: **Create UAT plans for at least 3 features**

> **REMEMBER**: You have to execute this test plan in week 4 of your project. So it would be ideal if your test plan is well thought through as it will expedite the testing process.

### Requirements

- Create 1 document per team, within the milestones folder in the project directory, that describes how, at least, 3 features within your finished product will be tested.

- The test plans should include specific test cases (user acceptance test cases) that describe the data and the user activity that will be executed in order to verify proper functionality of the feature.

- The test plans should include a description of the test data that will be used to test the feature.

- The test plans should include a description of the test environment ( localhost / cloud ) that will be used to test the feature.

- The test plans should include a description of the test results that will be used to test the feature.

- The test plan should include information about the user acceptance testers.

---

1. Feature 1: Login page
Specific test cases (user acceptance test cases) that describe the data and the user activity that will be executed in order to verify proper functionality of the feature:
The login page will be tested by testing the user inputs. The user will input their username and password into the specified fields. This will be the only data entered and this data will be tested.

Description of the test data that will be used to test the feature:
The test data will be checking the users table to see if the username exists and if it does, then check to see if the passwords match. We will also check edge cases such as if there is no input in either field.

Description of the test environment:
This testing will be done on the localhost test environment. We chose this enviornment because then the features can be tested before putting the entire feature out to production. This will help us test our code safely.

Description of the test results that will be used to test the feature:
If the test passes (the username and password are found in the table), then the user can continue on to the application but if it fails (username or password is not found) then the user will receieve an appropraite error and be instructed how to act accordingly.

Information about the user acceptance testers:
We will test using test cases written in the codebase. We will discuss as a team what we wish the applications to achieve and write test cases accordingly. Mandatory fields are a username, password, and email address. This information will already be stored in the users and user_to_groups tables.


1. Feature 2: Register page
Specific test cases (user acceptance test cases) that describe the data and the user activity that will be executed in order to verify proper functionality of the feature:
The register page will be tested by testing the user inputs. The user will input a username, password, and email address. This data will verfiy whether or not the username already exists. The information will be stored in the users and user_to_groups tables.

Description of the test data that will be used to test the feature:
The test data will be checking the users table to see if the username exists. If it does not, then add the username. We will also check edge cases such as if there is no input in either field.

Description of the test environment:
This testing will be done on the localhost test environment. We chose this enviornment because then the features can be tested before putting the entire feature out to production.

Description of the test results that will be used to test the feature:
If the test passes (the username and password is added to the appropriate tables), then allow the user to access the application. If the test fails (username is already found in the table), then ask the user to enter a different username.

Information about the user acceptance testers:
We will test using test cases written in the codebase. We will discuss as a team what we wish the applications to achieve and write test cases accordingly. Mandatory fields are a username, password, confirm a password, and email address. The test data will be the current users in the users table.


1. Feature 3: Automatic payments calculator
Specific test cases (user acceptance test cases) that describe the data and the user activity that will be executed in order to verify proper functionality of the feature:
This feature will be tested by checking the inputs the user provides for the fill in the blanks. This feature allows the user to see how much they owe from an expense. They enter the total expense amount and the percentage of expenses that they pay. The numbers/data that they enter will be tested. These will be stored in temporary variables because they do not have to be stored anywhere long term. 

Description of the test data that will be used to test the feature:
There is no test data for this feature because each input is unique and does not depend on any other information. We will check if either field is empty and has the appropriate data.

Description of the test environment:
This testing will be done on the localhost test environment. We chose this enviornment because then the features can be tested before putting the entire feature out to production. This will help us test our code safely.

Description of the test results that will be used to test the feature:
If the test passes (checking that appropriate data was entered), then continue on with the calculation. If the test fails, then ask the user to re-enter the information.

Information about the user acceptance testers:
We will test using test cases written in the codebase. We will discuss as a team what we wish the applications to achieve and write test cases accordingly. Mandatory data is the amount of a bill/expense and the percentage that they pay of the bill/expense.

