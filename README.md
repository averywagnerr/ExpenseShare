<h1 align="center">ExpenseShare</h1> 
<p align="center">
An app designed for financiers to manage group expenses.
</p>

<p align="center">
  <a href="#money_with_wings-description">Description</a> &nbsp;&bull;&nbsp;
  <a href="#technologist-contributors">Contributors</a> &nbsp;&bull;&nbsp;
  <a href="#gear-tech-stack">Tech Stack</a> &nbsp;&bull;&nbsp;
  <a href="#clipboard-prerequisites">Prerequisites</a> &nbsp;&bull;&nbsp;
  <a href="#zap-how-to-run-locally">How to Run Locally</a> &nbsp;&bull;&nbsp;
  <a href="#test_tube-running-tests">Running Tests</a> &nbsp;&bull;&nbsp;
  <a href="#rocket-deployment">Deployment</a>
</p>

> :construction: WIP

<br>

## :money_with_wings: Description

ExpenseShare is an expense organizer that allows you and a group of other people to keep on top of your expenses and easily check past expenses along with calculating new expenses. Unlike RocketMoney, our product allows you to scan receipts to speed up the process of tracking and splitting expenses.

Our application allows users to send transactions to others in the group. The application also allows users to upload a picture of their receipts to the website and have relevant information put into a table for easy tracking. The users will recieve relevant emails regarding their account. Our application also allows users to deposit and withdraw money to and from their account. They can also convieniently calculate how much of an expense they owe with a calculator.

### :star: Features

- **Group Account Creation**: Enable users to create group accounts to manage shared expenses, allowing for CRUD operations for groups, members, and expenses. Users can add, edit, or remove group members and expenses as needed.

- **Automated Expense Calculation**: Implement automated calculation of who owes what to whom based on entered expenses. The app will automatically calculate each member's share of the expense and update the balances accordingly.

- **Historical Expense Tracking**: Provide historical tracking of all group expenses and settlements, allowing users to view past transactions and payments. This feature helps users keep track of their spending and ensures transparency within the group.

- **Notification System**: Implement a notification system to alert users about upcoming payments or unsettled debts. Users will receive notifications reminding them of pending payments or debts that need to be settled, helping them stay organized and on top of their finances.

- **OCR (Optical Character Recognition) Integration**: Potentially use OCR APIs to scan and split receipts, making it easier for users to track and split expenses accurately. This feature eliminates the need for manual entry of expenses and simplifies the expense-sharing process.

## :technologist: Contributors

|         Name         |               Email               | Github Username |
| :------------------: | :-------------------------------: | :-------------: |
|      Mason Bott      | mason.bott@colorado.edu           |  masoniis       |
|    Tyler Haskins     | tyha8015@colorado.edu             |  TylerHaskins   |
|    Connor Julson     | connor.julson@colorado.edu        |  CJulson        |
| Mariana Vadas-Arendt | mariana.vadas-arendt@colorado.edu |  marianavadas   |
|     Avery Wagner     |     avery.wagner@colorado.edu     |  averywagnerr   |

## :gear: Tech Stack
The main language that we used is javascript. 
For UI, we used tailwindcss and handlebars 
We used the mindee API which is an OCR API. 
Our database is in MySQL and PostgreSQL 
We also used multer to mitigate uploading files to the website 
We used nodemailer to send emails to the users regarding their account

## :clipboard: Prerequisites
Software to download before running the application: 
Nodemailer 
Multer 
Tailwindcss 
mindee 
Handlebars 
Bootstrap 
Axios 
bcrypt 
nodemon 
chai 
mocha 

## :zap: How to Run Locally
Create an env file and enter these values: 

POSTGRES_USER="postgres" <br>
POSTGRES_PASSWORD="password" <br>
POSTGRES_DB="users_db" <br>

SESSION_SECRET="super duper secret!" <br>
API_KEY="45c59448df5500383d09c23125d4f5f7" <br>
PASS="yqgz czqm jpcm evaa" <br>

Then run the following comands in the terminal:
docker-compose down -v
docker-compose up

Now the application should be available on the link displayed on "Link to Deployment".
## :test_tube: Running Tests
The tests will run automatically when you run the comand docker-compose up.

## :rocket: Link to Deployment
After docker is running, the application will be available here:
http://localhost:3000
