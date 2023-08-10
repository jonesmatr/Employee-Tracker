
-- Insert sample data into department table
INSERT INTO department (name) VALUES ('Sales'), ('Engineering'), ('HR');

-- Insert sample data into role table
INSERT INTO role (title, salary, department_id) VALUES 
    ('Sales Manager', 60000, 1),
    ('Engineer', 75000, 2),
    ('HR Manager', 55000, 3);

-- Insert sample data into employee table
INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES 
    ('John', 'Doe', 1, NULL),  -- John Doe is a Sales Manager and has no manager
    ('Jane', 'Smith', 2, 1),   -- Jane Smith is an Engineer and reports to John Doe
    ('Bob', 'Johnson', 3, 1);  -- Bob Johnson is an HR Manager and reports to John Doe
