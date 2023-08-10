const mysql = require('mysql2');
const inquirer = require('inquirer');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'your_database_name' // Replace this with your actual database name
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

function mainMenu() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'What would you like to do?',
            choices: [
                'View All Departments',
                'View All Roles',
                'View All Employees',
                // ... add other choices
                'Exit'
            ]
        }
    ]).then(answer => {
        switch (answer.choice) {
            case 'View All Departments':
                viewAllDepartments();
                break;
            // Handle other choices similarly
            case 'Exit':
                connection.end();
                break;
        }
    });
}
