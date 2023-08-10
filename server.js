const mysql = require('mysql2');
const inquirer = require('inquirer');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'employee_tracker' 
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
        mainMenu();
    });
}

// Function to add a department
function addDepartment() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter the name of the new department:',
            validate: name => name ? true : "Name cannot be empty."
        }
    ]).then(answer => {
        connection.query('INSERT INTO department SET ?', { name: answer.name }, (err) => {
            if (err) throw err;
            console.log('Department added successfully.');
            // Return to main menu or exit
            mainMenu();
        });
    });
}

// Function to add a role
function addRole() {
    // First, fetch the list of departments
    connection.query('SELECT * FROM department', (err, departments) => {
        if (err) throw err;
        inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter the title of the new role:',
                validate: title => title ? true : "Title cannot be empty."
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the salary for this role:',
                validate: salary => !isNaN(salary) ? true : "Please enter a valid number."
            },
            {
                type: 'list',
                name: 'department',
                message: 'Select the department for this role:',
                choices: departments.map(dept => ({ name: dept.name, value: dept.id }))
            }
        ]).then(answer => {
            connection.query('INSERT INTO role SET ?', {
                title: answer.title,
                salary: answer.salary,
                department_id: answer.department
            }, (err) => {
                if (err) throw err;
                console.log('Role added successfully.');
                // Return to main menu or exit
                mainMenu();
            });
        });
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
       // Header
       console.log('ID\tTitle\t\tSalary\tDepartment');
       console.log('----------------------------------------');

       // Data
       results.forEach(result => {
           console.log(`${result.id}\t${result.title}\t${result.salary}\t${result.department}`);
       });
        // Return to main menu or exit
        mainMenu();
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

        // Define headers
        const headers = ['ID', 'First Name', 'Last Name', 'Role', 'Department', 'Salary', 'Manager'];

        // Find the maximum width for each column
        const colWidths = headers.map((header, index) => {
            // Get maximum length of data in this column
            const maxDataLength = Math.max(...results.map(result => String(result[header.toLowerCase().replace(' ', '_')]).length));
            return Math.max(header.length, maxDataLength) + 2;  // Add 2 for a bit of padding
        });

        // Helper function to pad strings for display
        const padString = (str, length) => str + ' '.repeat(length - str.length);

        // Display headers
        console.log(headers.map((header, index) => padString(header, colWidths[index])).join(''));

        // Display line under headers
        console.log(colWidths.map(width => '-'.repeat(width)).join(''));

        // Display data
        results.forEach(result => {
            const row = [
                result.id,
                result.first_name,
                result.last_name,
                result.role,
                result.department,
                result.salary,
                result.manager || 'None'
            ];
            console.log(row.map((item, index) => padString(String(item), colWidths[index])).join(''));
        });

        mainMenu();
    });
}



// Function to add an employee
function addEmployee() {
    // Fetch available roles and employees (for manager selection)
    let roles;
    let employees;
    connection.query('SELECT * FROM role', (err, roleResults) => {
        if (err) throw err;
        roles = roleResults;
        connection.query('SELECT * FROM employee', (err, employeeResults) => {
            if (err) throw err;
            employees = employeeResults;
            inquirer.prompt([
                {
                    type: 'input',
                    name: 'firstName',
                    message: 'Enter the first name of the employee:',
                    validate: name => name ? true : "Name cannot be empty."
                },
                {
                    type: 'input',
                    name: 'lastName',
                    message: 'Enter the last name of the employee:',
                    validate: name => name ? true : "Name cannot be empty."
                },
                {
                    type: 'list',
                    name: 'role',
                    message: 'Select the role for this employee:',
                    choices: roles.map(role => ({ name: role.title, value: role.id }))
                },
                {
                    type: 'list',
                    name: 'manager',
                    message: 'Select the manager for this employee:',
                    choices: [...employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id })), { name: 'None', value: null }]
                }
            ]).then(answer => {
                connection.query('INSERT INTO employee SET ?', {
                    first_name: answer.firstName,
                    last_name: answer.lastName,
                    role_id: answer.role,
                    manager_id: answer.manager
                }, (err) => {
                    if (err) throw err;
                    console.log('Employee added successfully.');
                    // Return to main menu or exit
                    mainMenu();
                });
            });
        });
    });
}

// Function to update an employee's role
function updateEmployeeRole() {
    // Fetch employees and roles
    let employees;
    let roles;
    connection.query('SELECT * FROM employee', (err, employeeResults) => {
        if (err) throw err;
        employees = employeeResults;
        connection.query('SELECT * FROM role', (err, roleResults) => {
            if (err) throw err;
            roles = roleResults;
            inquirer.prompt([
                {
                    type: 'list',
                    name: 'employee',
                    message: 'Select an employee to update:',
                    choices: employees.map(emp => ({ name: `${emp.first_name} ${emp.last_name}`, value: emp.id }))
                },
                {
                    type: 'list',
                    name: 'role',
                    message: 'Select the new role for this employee:',
                    choices: roles.map(role => ({ name: role.title, value: role.id }))
                }
            ]).then(answer => {
                connection.query('UPDATE employee SET ? WHERE ?', [
                    { role_id: answer.role },
                    { id: answer.employee }
                ], (err) => {
                    if (err) throw err;
                    console.log('Employee role updated successfully.');
                    // Return to main menu or exit
                    mainMenu();
                });
            });
        });
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
                'Add Department',
                'Add Role',
                'Add Employee',
                'Update Employee Role',
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
            case 'Add Department':
                addDepartment();
                break;
            case 'Add Role':
                addRole();
                break;
            case 'Add Employee':
                addEmployee();
                break;
            case 'Update Employee Role':
                updateEmployeeRole();
                break;
            case 'Exit':
                connection.end();
                break;
        }
    });
}

