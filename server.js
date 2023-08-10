const mysql = require('mysql2');
const inquirer = require('inquirer');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'employee_tracker' // Replace this with your actual database name
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

// Function to view all roles
function viewAllRoles() {
    const query = `
        SELECT role.id, role.title, role.salary, department.name AS department 
        FROM role 
        LEFT JOIN department ON role.department_id = department.id
    `;
    connection.query(query, (err, results) => {
        if (err) throw err;
        console.table(results);
        // Return to main menu or exit
    });
}

// Function to view all employees
function viewAllEmployees() {
    const query = `
        SELECT 
            e.id, 
            e.first_name, 
            e.last_name, 
            role.title AS role, 
            department.name AS department, 
            role.salary, 
            CONCAT(m.first_name, ' ', m.last_name) AS manager 
        FROM employee e
        LEFT JOIN role ON e.role_id = role.id
        LEFT JOIN department ON role.department_id = department.id
        LEFT JOIN employee m ON e.manager_id = m.id
    `;
    connection.query(query, (err, results) => {
        if (err) throw err;
        console.table(results);
        // Return to main menu or exit
    });
}

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
                // ... add other choices if needed
                'Exit'
            ]
        }
    ]).then(answer => {
        switch (answer.choice) {
            case 'View All Departments':
                viewAllDepartments();
                break;
            case 'View All Roles':
                viewAllRoles();
                break;
            case 'View All Employees':
                viewAllEmployees();
                break;
            // Handle other choices similarly, if added
            case 'Exit':
                connection.end();
                break;
        }
    });
}
