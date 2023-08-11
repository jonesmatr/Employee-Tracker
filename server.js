// Required packages/modules
const mysql = require('mysql2');
const inquirer = require('inquirer');

// Utility function to pad strings for table display
const padString = (str, length) => str + ' '.repeat(length - str.length);
// Utility function to create dashed lines for table display
const createDashedLine = (colWidths) => {
    return colWidths.map(width => '-'.repeat(width - 1)).join(' ');
};

// Set up MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'employee_tracker'
});

// Display a welcome message
console.log(`
  ______                 _                       
 |  ____|               | |                      
 | |__   _ __ ___  _ __ | | ___  _   _  ___  ___ 
 |  __| | '_ \` _ \\| '_ \\| |/ _ \\| | | |/ _ \\/ _ \\
 | |____| | | | | | |_) | | (_) | |_| |  __/  __/
 |______|_| |_| |_| .__/|_|\\___/ \\__, |\\___|\\___|
 |  \\/  |         | |             __/ |          
 | \\  / | __ _ _ _|_| __ _  __ _ |___/_ __       
 | |\\/| |/ _\` | '_ \\ / _\` |/ _\` |/ _ \\ '__|      
 | |  | | (_| | | | | (_| | (_| |  __/ |         
 |_|  |_|\__,_ |_| |_|\\__,_|\\__, |\\___|_|         
                            __/ |                
                           |___/                 
`);

// Connect to the database
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to the database.');
    mainMenu();  // Display the main menu once connected
});

// Function to view all departments
function viewAllDepartments() {
    const query = 'SELECT * FROM department';
    connection.query(query, (err, results) => {
        if (err) throw err;

        const headers = ['ID', 'Name'];
        const colWidths = headers.map((header, index) => {
            const maxDataLength = Math.max(...results.map(result => String(result[header.toLowerCase()]).length));
            return Math.max(header.length, maxDataLength) + 2;
        });

        console.log(headers.map((header, index) => padString(header, colWidths[index])).join(' '));
        console.log(createDashedLine(colWidths));

        results.forEach(result => {
            const row = [result.id, result.name];
            console.log(row.map((item, index) => padString(String(item), colWidths[index])).join(''));
        });

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
        SELECT role.id, role.title, department.name AS department, role.salary  
        FROM role 
        LEFT JOIN department ON role.department_id = department.id
    `;
    connection.query(query, (err, results) => {
        if (err) throw err;

        const headers = ['ID', 'Title', 'Department', 'Salary'];
        const colWidths = headers.map((header, index) => {
            const maxDataLength = Math.max(...results.map(result => String(result[header.toLowerCase().replace(' ', '_')]).length));
            return Math.max(header.length, maxDataLength) + 2;
        });

        const padString = (str, length) => str + ' '.repeat(length - str.length);

        console.log(headers.map((header, index) => padString(header, colWidths[index])).join(' '));
        console.log(createDashedLine(colWidths));

        results.forEach(result => {
            const row = [result.id, result.title, result.department, result.salary];
            console.log(row.map((item, index) => padString(String(item), colWidths[index])).join(''));
        });

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
            role.title, 
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

        const headers = ['ID', 'First Name', 'Last Name', 'Title', 'Department', 'Salary', 'Manager'];

        // Calculate column widths based on the maximum length of data in each column
        const colWidths = headers.map((header, index) => {
            const headerLength = header.length;

            // Find the longest piece of data in this column
            const maxDataLength = results.reduce((max, row) => {
                const field = header.toLowerCase().replace(' ', '_');
                return Math.max(max, String(row[field]).length);
            }, 0);

            return Math.max(headerLength, maxDataLength) + 2;  // Add 2 for padding
        });

        console.log(headers.map((header, index) => padString(header, colWidths[index])).join(' '));
        console.log(colWidths.map(width => '-'.repeat(width)).join(' '));

        results.forEach(result => {
            const row = [
                result.id,
                result.first_name,
                result.last_name,
                result.title,
                result.department,
                result.salary,
                result.manager || 'None'
            ];
            console.log(row.map((item, index) => padString(String(item), colWidths[index])).join(' '));
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

// Function to update an employee's manager
function updateEmployeeManager() {
    // First, we need to get a list of employees
    connection.query('SELECT id, CONCAT(first_name, " ", last_name) AS name FROM employee', (err, employees) => {
        if (err) throw err;

        inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Which employee\'s manager do you want to update?',
                choices: employees.map(employee => ({
                    name: employee.name,
                    value: employee.id
                }))
            },
            {
                type: 'list',
                name: 'managerId',
                message: 'Who is the employee\'s new manager?',
                choices: employees.map(employee => ({
                    name: employee.name,
                    value: employee.id
                })).concat({ name: "None", value: null })  // Allow setting no manager
            }
        ]).then(answers => {
            connection.query('UPDATE employee SET manager_id = ? WHERE id = ?', [answers.managerId, answers.employeeId], (err) => {
                if (err) throw err;
                console.log('Updated employee\'s manager.');
                mainMenu();
            });
        });
    });
}

// Function to view all employees by manager
function viewEmployeesByManager() {
    // First, we need to get a list of managers
    connection.query('SELECT DISTINCT e.manager_id, CONCAT(m.first_name, " ", m.last_name) AS manager_name FROM employee e JOIN employee m ON e.manager_id = m.id WHERE e.manager_id IS NOT NULL', (err, managers) => {
        if (err) throw err;

        inquirer.prompt([
            {
                type: 'list',
                name: 'managerId',
                message: 'Which manager\'s employees do you want to view?',
                choices: managers.map(manager => ({
                    name: manager.manager_name,
                    value: manager.manager_id
                }))
            }
        ]).then(answer => {
            const query = `
                SELECT e.id, e.first_name, e.last_name, r.title 
                FROM employee e
                JOIN role r ON e.role_id = r.id
                WHERE e.manager_id = ?
            `;

            connection.query(query, [answer.managerId], (err, employees) => {
                if (err) throw err;

                const headers = ['ID', 'First Name', 'Last Name', 'Title'];

                // Calculate column widths
                const colWidths = headers.map((header, index) => {
                    const headerLength = header.length;

                    const maxDataLength = employees.reduce((max, employee) => {
                        const field = header.toLowerCase().replace(' ', '_');
                        return Math.max(max, String(employee[field]).length);
                    }, 0);

                    return Math.max(headerLength, maxDataLength) + 2;  // Add 2 for padding
                });

                console.log(headers.map((header, index) => padString(header, colWidths[index])).join(' '));
                console.log(colWidths.map(width => '-'.repeat(width)).join(' '));

                employees.forEach(employee => {
                    const row = [
                        employee.id,
                        employee.first_name,
                        employee.last_name,
                        employee.title
                    ];
                    console.log(row.map((item, index) => padString(String(item), colWidths[index])).join(' ')); // Print each row
                });

                mainMenu();
            });
        });
    });
}

// Function to view all employees by department
function viewEmployeesByDepartment() {
    // First, we get a list of departments
    connection.query('SELECT id, name FROM department', (err, departments) => {
        if (err) throw err;

        inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Which department\'s employees do you want to view?',
                choices: departments.map(dept => ({
                    name: dept.name,
                    value: dept.id
                }))
            }
        ]).then(answer => {
            const query = `
                SELECT e.id, e.first_name, e.last_name, r.title 
                FROM employee e
                JOIN role r ON e.role_id = r.id
                WHERE r.department_id = ?
            `;

            connection.query(query, [answer.departmentId], (err, employees) => { // Get all employees by department
                if (err) throw err;

                const headers = ['ID', 'First Name', 'Last Name', 'Title'];

                // Calculate column widths
                const colWidths = headers.map((header, index) => {
                    const headerLength = header.length;

                    const maxDataLength = employees.reduce((max, employee) => {
                        const field = header.toLowerCase().replace(' ', '_');
                        return Math.max(max, String(employee[field]).length);
                    }, 0);

                    return Math.max(headerLength, maxDataLength) + 2;  // Add 2 for padding
                });

                console.log(headers.map((header, index) => padString(header, colWidths[index])).join(' '));
                console.log(colWidths.map(width => '-'.repeat(width)).join(' '));

                employees.forEach(employee => {
                    const row = [
                        employee.id,
                        employee.first_name,
                        employee.last_name,
                        employee.title
                    ];
                    console.log(row.map((item, index) => padString(String(item), colWidths[index])).join(' '));
                });

                mainMenu();
            });
        });
    });
}

// Function to delete an employee
function deleteFromDatabase() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'What do you want to delete?',
            choices: ['Department', 'Role', 'Employee', 'Back to Main Menu']
        }
    ]).then(answer => {
        switch (answer.choice) {
            case 'Department':
                // Call a function to handle deleting a department
                deleteDepartment();
                break;
            case 'Role':
                // Call a function to handle deleting a role
                deleteRole();
                break;
            case 'Employee':
                // Call a function to handle deleting an employee
                deleteEmployee();
                break;
            case 'Back to Main Menu':
                mainMenu();
                break;
        }
    });
}

// Functions to delete department from the database
function deleteDepartment() {
    connection.query('SELECT * FROM department', (err, departments) => {
        if (err) throw err;

        inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Which department would you like to delete?',
                choices: departments.map(department => ({
                    name: department.name,
                    value: department.id
                }))
            }
        ]).then(answer => {
            connection.query('DELETE FROM department WHERE id = ?', [answer.departmentId], (err, result) => {
                if (err) throw err;
                console.log('Department deleted successfully!');
                mainMenu();
            });
        });
    });
}

// Functions to delete role from the database
function deleteRole() {
    connection.query('SELECT * FROM role', (err, roles) => {
        if (err) throw err;

        inquirer.prompt([
            {
                type: 'list',
                name: 'roleId',
                message: 'Which role would you like to delete?',
                choices: roles.map(role => ({
                    name: role.title,
                    value: role.id
                }))
            }
        ]).then(answer => {
            connection.query('DELETE FROM role WHERE id = ?', [answer.roleId], (err, result) => {
                if (err) throw err;
                console.log('Role deleted successfully!');
                mainMenu();
            });
        });
    });
}

// Functions to delete employee from the database
function deleteEmployee() {
    connection.query('SELECT * FROM employee', (err, employees) => {
        if (err) throw err;

        inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Which employee would you like to delete?',
                choices: employees.map(employee => ({
                    name: `${employee.first_name} ${employee.last_name}`,
                    value: employee.id
                }))
            }
        ]).then(answer => {
            connection.query('DELETE FROM employee WHERE id = ?', [answer.employeeId], (err, result) => {
                if (err) throw err;
                console.log('Employee deleted successfully!');
                mainMenu();
            });
        });
    });
}

// Function to view utilized budget for a department
function viewDepartmentBudget() {
    connection.query('SELECT id, name FROM department', (err, departments) => {
        if (err) throw err;

        inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'For which department do you want to view the utilized budget?',
                choices: departments.map(dept => ({
                    name: dept.name,
                    value: dept.id
                }))
            }
        ]).then(answer => {
            const query = `
                SELECT SUM(r.salary) AS budget 
                FROM employee e
                JOIN role r ON e.role_id = r.id
                WHERE r.department_id = ?
            `;

            connection.query(query, [answer.departmentId], (err, result) => {
                if (err) throw err;
                console.log(`Total utilized budget for the department: $${result[0].budget}`);
                mainMenu();
            });
        });
    });
}

// Function to run the application 
function mainMenu() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'What would you like to do?',
            choices: [
                'View All Employees',
                'Add Employee',
                'Update Employee Role',
                'View All Roles',
                'Add Role',
                'View All Departments',
                'Add Department',
                'Update Employee Manager',
                'View Employees by Manager',
                'View Employees by Department',
                'Delete from Database',
                'View Department Budget',
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
            case 'Update Employee Role':
                updateEmployeeRole();
                break;
            case 'Update Employee Manager':
                updateEmployeeManager();
                break;
            case 'Add Role':
                addRole();
                break;
            case 'Add Employee':
                addEmployee();
                break;
            case 'Add Department':
                addDepartment();
                break;
            case 'View Employees by Manager':
                viewEmployeesByManager();
                break;
            case 'View Employees by Department':
                viewEmployeesByDepartment();
                break;
            case 'Delete from Database':
                deleteFromDatabase();
                break;
            case 'View Department Budget':
                viewDepartmentBudget();
                break;
            case 'Exit':
                connection.end();
                break;
        }
    });
}