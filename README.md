LifeLink

There are three types of users:

- Requester – Searches for blood and sends requests.
- Organisation – Manages blood stock and responds to requests.
- Admin – Verifies organisations and manages the platform.


Database Tables

I decided 6 tables ( from the pic sent on grp)

- USERS: Stores login details and user roles.
- ORGANISATIONS: Stores NGO and Hospital details.
- BLOOD_GROUPS: Stores all eight blood groups.
- INVENTORY: Stores available blood units in each organisation.
- BLOOD_REQUESTS: Stores blood requests made by users.
- REQUEST_RESPONSES: Stores responses given by organisations.

PL/SQL Packages
3 of them

- PKG_USER: Handles user registration and login.
- PKG_BLOOD: Handles blood stock checking and updating.
- PKG_REQUEST: Handles blood requests and their responses.

Folder Details

- public: Contains HTML, CSS and JavaScript files for the frontend.
- server: Contains backend files, including routes, controllers and database connection.
- database: Contains SQL files for creating tables, inserting sample data, testing and creating packages.
- server.js: Main file used to start the backend.
- package.json: Contains project dependencies.
- .env: Stores database connection details.
- .gitignore: Specifies files that should not be uploaded to GitHub.
- README.md: Contains information about the project.

SQL File Execution Order

Run the following files in this order:

1. "01_schema.sql" – Creates the tables.
2. "02_dummy_data.sql" – Inserts sample data.
3. "pkg_user.sql" – Creates the user package.
4. "pkg_blood.sql" – Creates the blood package.
5. "pkg_request.sql" – Creates the request package.
6. "03_test_queries.sql" – Tests the tables and packages.//to check if all connection works 


Main Features of the project are-

- User registration and login.
- Searching for blood by blood group and city.
- Sending blood requests.
- Managing organisation blood stock.
- Accepting or declining requests.
- Admin verification of organisations.