import pool from './connection.js';
import inquirer from 'inquirer';
async function mainMenu() {
    const choice = await inquirer.prompt({
        type: "list",
        name: "option",
        message: "What would you like to do",
        choices: [
            "View All Employees",
            "Add Employee",
            "Update Employee Role",
            "View All Roles",
            "Add Role",
            "View All Departments",
            "Add Department",
            "Update Employee Manager",
            "View Employees By Managers",
            "View Employees By Department",
            "Quit",
        ],
    })
        .then(async (answer) => {
        switch (answer.option) {
            case "View All Employees":
                await viewAllEmployees();
                break;
            case "Add Employee":
                await addEmployee();
                break;
            case "Update Employee Role":
                await updateEmployeeRole();
                break;
            case "View All Roles":
                await viewAllRoles();
                break;
            case "Add Role":
                await addRole();
                break;
            case "View All Departments":
                await viewAllDepartments();
                break;
            case "Add Department":
                await addDepartments();
                break;
            case "Update Employee Manager":
                await updateEmployeeManagers();
                break;
            case "View Employees By Managers":
                await viewEmployeesByManagers();
                break;
            case "View Employees By Department":
                await viewEmployeesByDepartment();
                break;
            case "Quit":
                console.log("Goodbye!");
                process.exit(0);
        }
    });
}
;
async function viewAllEmployees() {
    const result = await pool.query(`SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, COALESCE(m.first_name || m.last_name, 'No Manager') AS manager_name 
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN employees m ON e.manager_id = m.id
    ORDER BY e.id;`);
    console.table(result.rows);
    mainMenu();
}
;
async function addEmployee() {
    const roles = await pool.query("SELECT id, title FROM roles ORDER BY id;");
    const employees = await pool.query("SELECT id, first_name, last_name FROM employees ORDER BY id;");
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "first_name",
            message: "Enter the employee's first name:",
        },
        {
            type: "input",
            name: "last_name",
            message: "Enter the employee's last name:",
        },
        {
            type: "list",
            name: "role_id",
            message: "Select the employee's role:",
            choices: roles.rows.map((role) => ({ name: role.title, value: role.id }))
        },
        {
            type: "list",
            name: "manager_id",
            message: "Select the manager:",
            choices: [
                { name: "No Manager", value: null },
                ...employees.rows.map((employee) => ({
                    name: `${employee.first_name} ${employee.last_name}`,
                    value: employee.id
                }))
            ]
        }
    ]);
    await pool.query('INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [answers.first_name, answers.last_name, answers.role_id, answers.manager_id]);
    console.log("Employee added successfully!");
    mainMenu();
}
;
//update employee role
async function updateEmployeeRole() {
    try {
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "employee_id",
                message: "Enter employee ID:",
                validate: input => !isNaN(Number(input)),
            },
            {
                type: "input",
                name: "role_id",
                message: "Enter new role ID:",
                validate: input => !isNaN(Number(input)),
            },
        ]);
        // Convert inputs to numbers
        const employeeId = Number(answers.employee_id);
        const roleId = Number(answers.role_id);
        const result = await pool.query(`UPDATE employees SET role_id = $1 WHERE id = $2 RETURNING *`, [roleId, employeeId]);
        if (result.rowCount === 0) {
            console.log("No employee found with the given ID.");
        }
        else {
            console.log("Employee role updated successfully!");
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error("Error updating employee role:", error.message);
        }
        else {
            console.error("Error updating employee role:", error);
        }
    }
    finally {
        mainMenu();
    }
}
;
//view all roles
async function viewAllRoles() {
    try {
        const result = await pool.query(`
      SELECT 
        r.id, 
        r.title, 
        d.department_name AS department, 
        r.salary
      FROM roles r
      LEFT JOIN departments d ON r.department_id = d.id
      ORDER BY r.id;
    `);
        console.table(result.rows);
    }
    catch (error) {
        console.error("Error fetching roles:", error);
    }
    finally {
        mainMenu();
    }
}
// ADD Role
async function addRole() {
    try {
        // Fetch all departments to provide choices
        const { rows: departments } = await pool.query("SELECT id, department_name FROM departments ORDER BY id;");
        if (departments.length === 0) {
            console.log("No departments found. Please add a department first.");
            return mainMenu();
        }
        const answers = await inquirer.prompt([
            {
                type: "input",
                name: "title",
                message: "Enter role title:",
                validate: input => input.trim() !== "" || "Title cannot be empty",
            },
            {
                type: "input",
                name: "salary",
                message: "Enter salary:",
                validate: input => !isNaN(Number(input)) || "Please enter a valid number",
                filter: input => parseFloat(input), // Convert input to number
            },
            {
                type: "list",
                name: "department_id",
                message: "Select department:",
                choices: departments.map(dept => ({ name: dept.department_name, value: dept.id })),
            }
        ]);
        await pool.query(`INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)`, [answers.title, answers.salary, answers.department_id]);
        console.log("✅ Role added successfully!");
    }
    catch (error) {
        console.error("❌ Error adding role:", error);
    }
    finally {
        mainMenu();
    }
}
// view all departments
async function viewAllDepartments() {
    try {
        const result = await pool.query(`
      SELECT 
        d.id, 
        d.department_name
      FROM departments d
      ORDER BY id;
    `);
        console.table(result.rows);
        mainMenu();
    }
    catch (error) {
        console.error('Error executing query:', error);
    }
}
;
//add departments
async function addDepartments() {
    const answer = await inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Enter the new department name:"
        },
    ]);
    if (answer.name === "") {
        console.log("Department name cannot be empty.");
    }
    else {
        try {
            // Use parameterized query to safely insert the department name
            await pool.query(`INSERT INTO departments (department_name) VALUES ($1)`, [answer.name]);
            console.log(`Department '${answer.name}' added successfully.`);
        }
        catch (err) {
            console.error("Error adding department:", err);
        }
    }
    mainMenu();
}
;
//update employee manager
async function updateEmployeeManagers() {
    try {
        // Fetch all employees once
        const { rows: employees } = await pool.query("SELECT id, first_name, last_name FROM employees ORDER BY id;");
        if (employees.length === 0) {
            console.log("No employees found.");
            return;
        }
        // Prompt user to select an employee
        const { employee_id } = await inquirer.prompt([
            {
                type: "list",
                name: "employee_id",
                message: "Select the employee whose manager you want to update:",
                choices: employees.map(emp => ({
                    name: `${emp.first_name} ${emp.last_name}`,
                    value: emp.id
                }))
            }
        ]);
        // Filter employees to get available managers
        const managers = employees.filter(emp => emp.id !== employee_id);
        // Prompt user to select a manager
        const { manager_id } = await inquirer.prompt([
            {
                type: "list",
                name: "manager_id",
                message: "Select the new manager (or choose 'None' if no manager):",
                choices: [
                    { name: "None", value: null },
                    ...managers.map(emp => ({
                        name: `${emp.first_name} ${emp.last_name}`,
                        value: emp.id
                    }))
                ]
            }
        ]);
        // Update employee's manager
        await pool.query("UPDATE employees SET manager_id = $1 WHERE id = $2", [manager_id, employee_id]);
        // Log success message
        const updatedEmployee = employees.find(emp => emp.id === employee_id);
        console.log(`Manager updated successfully for ${updatedEmployee?.first_name} ${updatedEmployee?.last_name}!`);
    }
    catch (error) {
        console.error("Error updating manager:", error);
    }
    finally {
        mainMenu(); // Ensure main menu is called even if an error occurs
    }
}
// view employee by manager
async function viewEmployeesByManagers() {
    // Fetch all managers (employees who have at least one direct report)
    const managers = await pool.query(`
    SELECT DISTINCT m.id, m.first_name, m.last_name
    FROM employees e
    JOIN employees m ON e.manager_id = m.id
    ORDER BY m.id;
  `);
    if (managers.rows.length === 0) {
        console.log("No managers found in the system.");
        return;
    }
    // Prompt user to select a manager
    const { manager_id } = await inquirer.prompt([
        {
            type: "list",
            name: "manager_id",
            message: "Select a manager to view their employees:",
            choices: managers.rows.map((mgr) => ({
                name: `${mgr.first_name} ${mgr.last_name}`,
                value: mgr.id
            }))
        }
    ]);
    // Fetch employees under the selected manager
    const employees = await pool.query(`
    SELECT id, first_name, last_name, role_id 
    FROM employees 
    WHERE manager_id = $1
    ORDER BY id;
  `, [manager_id]);
    if (employees.rows.length === 0) {
        console.log("This manager has no assigned employees.");
    }
    else {
        console.log("Employees under this manager:");
        console.table(employees.rows);
        mainMenu();
    }
}
async function viewEmployeesByDepartment() {
    try {
        // Fetch departments
        const departments = await pool.query("SELECT id, department_name FROM departments ORDER BY id;");
        if (departments.rows.length === 0) {
            console.log("No departments found.");
            return;
        }
        // Prompt to select a department
        const { department_id } = await inquirer.prompt([{
                type: "list",
                name: "department_id",
                message: "Select a department:",
                choices: departments.rows.map((dept) => ({
                    name: dept.department_name,
                    value: dept.id
                }))
            }]);
        // Fetch employees in the selected department
        const employees = await pool.query(`
      SELECT e.id, e.first_name, e.last_name, r.title AS role, r.salary
      FROM employees e
      JOIN roles r ON e.role_id = r.id
      WHERE r.department_id = $1
      ORDER BY e.last_name;
    `, [department_id]);
        if (employees.rows.length === 0) {
            console.log("No employees found.");
        }
        else {
            console.log(`Employees in the selected department:`);
            console.table(employees.rows);
        }
        mainMenu();
    }
    catch (error) {
        console.error("Error:", error);
    }
}
// async function viewEmployeesByDepartment() {
//   // Fetch all departments
//   const departments = await pool.query("SELECT id, name FROM departments ORDER BY name;");
//   if (departments.rows.length === 0) {
//     console.log("No departments found in the system.");
//     return;
//   }
//   // Prompt user to select a department
//   const { department_id } = await inquirer.prompt([
//     {
//       type: "list",
//       name: "department_id",
//       message: "Select a department to view its employees:",
//       choices: departments.rows.map((dept: { name: any; id: any; }) => ({
//         name: dept.name,
//         value: dept.id
//       }))
//     }
//   ]);
//   // Fetch employees in the selected department
//   const employees = await pool.query(`
//     SELECT e.id, e.first_name, e.last_name, r.title AS role, r.salary
//     FROM employees e
//     JOIN roles r ON e.role_id = r.id
//     WHERE r.department_id = $1
//     ORDER BY e.last_name;
//   `, [department_id]);
//   if (employees.rows.length === 0) {
//     console.log("No employees found in this department.");
//   } else {
//     console.log(`Employees in the ${departments.rows.find((dept: { id: any; }) => dept.id === department_id)?.name} department:`);
//     console.table(employees.rows);
//     mainMenu();
//   }
// }
mainMenu();
