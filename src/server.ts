import express from 'express';
//import { Connection, QueryResult } from 'pg';
import pool  from './connection';
//import * as fs from 'fs';



import inquirer from 'inquirer';
//import { connect } from 'http2';
//import { error } from 'console';
//import { title } from 'process';



async function mainMenu() {
const choice = await inquirer.prompt(
    {
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
        "View Employees By Mangers",
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
          await viewAllRoles;
          break;
        case "Add Role":
          await addRole;
          break;
        case "View All Departments":
          await viewAllDepartments;
          break;
        case "Add Departments":
          await addDepartments;
          break;
        case "Update Employee Manager":
          await updateEmployeeManagers;
          break;
        case "View Employees By Manager":
          await viewEmployeesByManagers;
          break;
        case "View Employees By Department":
          await viewEmployeesByDepartment;
          break;
        case "Quit":
          console.log("Goodbye!");
          process.exit(0);
      }
    })
  };


async function viewAllEmployees() {
  const result = await pool.query( `SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, COALESCE(m.first_name || m.lastname, 'No Manager) AS manager_name 
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN employees m ON e.manager_id = m.id
    ORDER BY e.id;`
  );
console.table(result.rows);
    mainMenu();
  };

  async function addEmployee() {
    const roles = await pool.query("SELECT id, title FROM roles ORDER BY id;");
    const employees = await pool.query("SELECT id, first_name, last_name FROM employees ORDER BY id;");
    const answers = await inquirer.prompt([
      { type: "input",
        name: "first_name",
        message: "Enter the employee's first name:",
      },
      { type: "input",
        name: "last_name",
        message: "Enter the employee's last name:",
      },
      { type: "list",
        name: "role_id",
        message: "Enter role ID:",
        choices: roles.rows.map((role: { id: any; title: any;}) => ({ name: role.title, value: role.id }))
      },
      { type: "list",
        name: "manager_id",
        message: "Enter manager ID (or leave blank):",
        choices: employees.rows.map((employee: { id: any; first_name: any; last_name: any}) => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.id }))
      },
    ]);
  
// async function addEmployee() {
//   const roles = await pool.query("SELECT id, title FROM roles ORDER BY id;");
//   const employees = await pool.query("SELECT id, first_name, last_name FROM employees ORDER BY id;");
//   const answers = await inquirer.prompt([
//     { type: "input",
//       name: "first_name",
//       message: "Enter the employee's first name:",
//     },
//     { type: "input",
//       name: "last_name",
//       message: "Enter the employee's last name:",
//     },
//     { type: "list",
//       name: "role_id",
//       message: "Enter role ID:",
//       //validate: input => !isNaN(Number(input))
//       choices: roles.rows.map((role: { id: any; title: any;}) => ({id: role.id, value: role.title}))
//     },
//     { type: "list",
//       name: "manager_id",
//       message: "Enter manager ID (or leave blank):",
//       choices: employees.rows.map((employee: { id: any; first_name: any; last_name: any}) => ({id: employee.id, firstname: employee.first_name, lastname: employee.last_name}))
//       //default: null
//     },
    
//   ]);
// }
  await pool.query (
    'INSERT INTO employess (first_name, last_name, role_id, mananger_id) VALUE ($1, $2, $3, $4)',
    [answers.first_name, answers.last_name, answers.role_id, answers.manager_id]

  )
  console.log("Employee added successfully!"); 
  mainMenu();
};


 //async function updateEmployeeRole() {
  //const answers = await inquirer.prompt([
    //{ type: "list",
      //name: "employee",
      //message: "Select the employee to update",
      //choices: resEmployee.map((employees))
    //}

  //])
  
//}

async function updateEmployeeRole() {
  const answers = await inquirer.prompt([
    { type: "input",
      name: "employee_id",
      message: "Enter employee ID:",
      validate: input => !isNaN(Number(input)) },
    { type: "input",
      name: "role_id",
      message: "Enter new role ID:",
      validate: input => !isNaN(Number(input)) },
  ]);

  await pool.query(`UPDATE employees SET role_id = $1 WHERE id = $2`, [answers.role_id, answers.employee_id]);

  console.log("Employee role updated successfully!");
  mainMenu();
}


async function viewAllRoles() {
  const result = await pool.query( `SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary, COALESCE(m.first_name || m.lastname, 'No Manager) AS manager_name 
    FROM employees e
    LEFT JOIN roles r ON e.role_id = r.id
    LEFT JOIN departments d ON r.department_id = d.id
    LEFT JOIN employees m ON e.manager_id = m.id
    ORDER BY e.id;
    `);
    //if (err) throw error;
    console.table(result.rows);
    mainMenu();
}



// ADD Role
async function addRole() {
  // Fetch all departments to provide choices
  const departments = await pool.query("SELECT id, name FROM departments ORDER BY id;");
  
  const answers = await inquirer.prompt([
    { type:"input",
      name: "title",
      message: "Enter role title:"
    },
    { type: "input",
      name: "salary", 
      message: "Enter salary:", 
      validate: input => !isNaN(Number(input)) || "Please enter a valid number" 
    },
    { 
      type: "list",
      name: "department_id",
      message: "Select department:",
      choices: departments.rows.map((dept: { name: any; id: any; }) => ({ name: dept.name, value: dept.id }))
    }
  ]);

  await pool.query(
    `INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)`, 
    [answers.title, answers.salary, answers.department_id]
  );

  console.log("Role added successfully!");
  mainMenu();
}

// view all departments

async function viewAllDepartments() {
  const result = await pool.query("SELECT id, name FROM departments ORDER BY id;");
  console.log("All Departments:");
  console.table(result.rows);
}

  //add departments
  async function addDepartments() {
    const answer = await inquirer.prompt([
      { type: "input",
        name: "name",
        message: "Enter the new department name:" }
    ]);
  
    await pool.query(`INSERT INTO departments (name) VALUES ($1)`, [answer.name]);
  
    console.log(`Department "${answer.name}" added successfully!`);
    mainMenu();

  }

//update employee manager

async function updateEmployeeManagers() {
  // Fetch all employees to provide a selection
  const employees = await pool.query("SELECT id, first_name, last_name FROM employees ORDER BY id;");
  if (employees.rows.length === 0) {
    console.log("No employees found.");
    return;
  }

  // Prompt user to select an employee
  const { employee_id } = await inquirer.prompt([
    {
      type: "list",
      name: "employee_id",
      message: "Select the employee whose manager you want to update:",
      choices: employees.rows.map((emp: { first_name: any; last_name: any; id: any; }) => ({
        name: `${emp.first_name} ${emp.last_name}`,
        value: emp.id
      }))
    }
  ]);

  // Fetch employees again to allow selecting a manager
  const managers = employees.rows.filter((emp: { id: any; }) => emp.id !== employee_id);

  const { manager_id } = await inquirer.prompt([
    {
      type: "list",
      name: "manager_id",
      message: "Select the new manager (or choose 'None' if no manager):",
      choices: [
        { name: "None", value: null },
        ...managers.map((emp: { first_name: any; last_name: any; id: any; }) => ({
          name: `${emp.first_name} ${emp.last_name}`,
          value: emp.id
        }))
      ]
    }
  ]);

  // Update employee's manager in the database
  await pool.query(`UPDATE employees SET manager_id = $1 WHERE id = $2`, [manager_id, employee_id]);

  console.log("Employee's manager updated successfully!");
  mainMenu();
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
      choices: managers.rows.map((mgr: { first_name: any; last_name: any; id: any; }) => ({
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
  } else {
    console.log("Employees under this manager:");
    console.table(employees.rows);
    mainMenu();
  }
}

//view employees by Department


async function viewEmployeesByDepartment() {
  // Fetch all departments
  const departments = await pool.query("SELECT id, name FROM departments ORDER BY name;");
  
  if (departments.rows.length === 0) {
    console.log("No departments found in the system.");
    return;
  }

  // Prompt user to select a department
  const { department_id } = await inquirer.prompt([
    {
      type: "list",
      name: "department_id",
      message: "Select a department to view its employees:",
      choices: departments.rows.map((dept: { name: any; id: any; }) => ({
        name: dept.name,
        value: dept.id
      }))
    }
  ]);

  // Fetch employees in the selected department
  const employees = await pool.query(`
    SELECT e.id, e.first_name, e.last_name, r.title AS role, r.salary
    FROM employees e
    JOIN roles r ON e.role_id = r.id
    WHERE r.department_id = $1
    ORDER BY e.last_name;
  `, [department_id]);

  if (employees.rows.length === 0) {
    console.log("No employees found in this department.");
  } else {
    console.log(`Employees in the ${departments.rows.find((dept: { id: any; }) => dept.id === department_id)?.name} department:`);
    console.table(employees.rows);
    mainMenu();
  }
}