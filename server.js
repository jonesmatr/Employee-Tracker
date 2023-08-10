const mysql = require('mysql2');
const inquirer = require('inquirer');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'your_database_name'
  });
  
  connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database.');
    mainMenu();  // Call the main menu function after connecting
  });

  // Function to view all departments
function viewAllDepartments() {
    connection.query('SELECT * FROM department', (err, results) => {
      if (err) throw err;
      console.table(results);
      // Return to main menu or exit
    });
  }
  
  // You can create similar functions for viewAllRoles, viewAllEmployees, etc.

  