const inquirer = require('inquirer');

const connection = require ("./lib/mySql");
const commandMenuChoices = require ("./lib/commandManu");
const questions = require ("./lib/questions");

const InquirerFunctions = require ("./lib/inquirer");
const SQLquery = require ("./lib/sql_queries");

// Prompt types
const inquirerTypes = [
    'input', 'confirm', 'list'
]
// calling the main manu function to start the app
menu();

function menu() {
    const menuPrompt = new InquirerFunctions(inquirerTypes[2], 'menuChoice', questions.menuPrompt, commandMenuChoices);
    
    inquirer.prompt([menuPrompt.ask()]).then(operation => {

            const query1 = "SELECT role.title FROM role"
            const compRolesArrayQuery = new SQLquery(query1);
            const depNameQuery = "SELECT department.name FROM department";
            const depNamesArrayQuery = new SQLquery(depNameQuery);

// diffrent casses base on the selection from the main menu
            switch (operation.menuChoice) {

                case commandMenuChoices[2]:
                    return viewAllEmp();

                case commandMenuChoices[5]:
                    const actionChoice1 = "ADD"
                    compRolesArrayQuery.getQueryNoRepeats(EmpInfoPrompts, actionChoice1);
                    break;

                case commandMenuChoices[6]:
                    const actionChoice3 = "UPDATE EMP ROLE"
                    compRolesArrayQuery.getQueryNoRepeats(EmpInfoPrompts, actionChoice3);
                    break;

                case commandMenuChoices[1]:
                    return viewAllRoles();

                case commandMenuChoices[4]:
                    return addRole();

                case commandMenuChoices[0]:
                    return viewAllDep();

                case commandMenuChoices[3]:
                    depNamesArrayQuery.queryReturnResult(addDep);
                    break;

              
            }
        })
}
// function to view all the employees
function viewAllEmp() {
    const query = `SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, department.name
                     FROM employee
                     INNER JOIN role on role.id = employee.role_id
                     INNER JOIN department on department.id = role.department_id;`

    const empTable = new SQLquery(query);
    empTable.generalTableQuery(menu);
}

//funtion to add an employee
function addEmp(emp_info, managerObjArr) {

    console.log("You've entered employee ADD");
    const queryRoleIdFromTitle = "SELECT role.id FROM role WHERE role.title = (?) ;"
    connection.query(queryRoleIdFromTitle, emp_info.employee_role, function (err, res) {
        if (err) {
            throw err;
        }
        const empRoleId = res[0].id;
        const empFirstName = emp_info.first_name;
        const empLastName = emp_info.last_name;
        const empManagerName = emp_info.employee_manager.split(" ");
        const empManagerFirstName = empManagerName[0];
        const empManagerLastName = empManagerName[1];

        let empManagerID = 0;

        //Manager Id of the employee being added so that it can be added to the database
        for (let manager of managerObjArr) {
            if (manager.firstName == empManagerFirstName && manager.lastName === empManagerLastName) {
                empManagerID = manager.ID;
            }
        }

        const queryInsertEmpInfo = "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)"
        connection.query(queryInsertEmpInfo, [empFirstName, empLastName, empRoleId, empManagerID], function (err, res) {
            if (err) {
                throw err
            }
            console.log("Employee Added");
            menu();
        })
    })
}
// function to view all the roles
function viewAllRoles() {
    const query = `SELECT role.title, role.salary, department.name
                    FROM role
                    INNER JOIN department ON department.id = role.department_id`
    const roleTable = new SQLquery(query);

    roleTable.generalTableQuery(menu);
}
// function to view all the departments
function viewAllDep() {

    const query = `SELECT department.name
                    FROM department`

    const depTable = new SQLquery(query);

    depTable.generalTableQuery(menu);
}

// function to add a role
function addRole() {

    const queryDeps = "SELECT department.name FROM department;"
    connection.query(queryDeps, function (err, res) {

        if (err) throw err

        let depNameArr = []
        for (let i = 0; i < res.length; i++) {
            depNameArr.push(res[i].name)
        }

        const whatRole = new InquirerFunctions(inquirerTypes[0], 'role_to_add', questions.newRole)
        const whatSalary = new InquirerFunctions(inquirerTypes[0], 'role_salary', questions.salary)
        const whatdepartment = new InquirerFunctions(inquirerTypes[2], 'department', questions.department, depNameArr)


        Promise.all([whatRole.ask(), whatSalary.ask(), whatdepartment.ask()]).then(prompts => {
            inquirer.prompt(prompts).then(userChoices => {

                const getDepId = `SELECT department.id FROM department WHERE department.name = (?);`
                connection.query(getDepId, userChoices.department, function (err, res) {
                    if (err) {
                        throw err
                    }

                    const addRolequery = `INSERT INTO role (role.title, role.salary, role.department_id)
                                    VALUES ( (?), (?), (?));`
                    const addRole = new SQLquery(addRolequery, [userChoices.role_to_add, userChoices.role_salary, res[0].id]);

                    addRole.update(menu, "Role added!");
                })
            })
        })
    })
}
 // function to add a department 

function addDep(depNameArr) {

    const whatDep = new InquirerFunctions(inquirerTypes[0], 'dep_to_add', questions.newDep)

    inquirer.prompt([whatDep.ask()]).then(userChoice => {

        const alreadyExist = depNameArr.filter(department => {

            if (department.name == userChoice.dep_to_add) return true;
        })

        if (alreadyExist.length >= 1) {
            console.log("Department Already exists!")
            menu();
        } else {
            const addDepQuery = `INSERT INTO department (department.name) VALUES (?);`
            const addDep = new SQLquery(addDepQuery, userChoice.dep_to_add);

            addDep.update(menu, "Department added!");
        }
    })
}
// function to get employy info 
function EmpInfoPrompts(compRoles, actionChoice) {

    const query = "SELECT id, first_name, last_name FROM employee WHERE employee.id IN ( SELECT employee.manager_id FROM employee )";

    connection.query(query, function (err, res) {
        if (err) throw err
        
        let managerNamesArr = [];
        let managerObjArr = [];

        for (let i = 0; i < res.length; i++) {
            let name = res[i].first_name + " " + res[i].last_name;
            let managersobj = {
                ID: res[i].id,
                firstName: res[i].first_name,
                lastName: res[i].last_name
            }

            managerObjArr.push(managersobj);
            managerNamesArr.push(name);
        }

        const first_name = new InquirerFunctions(inquirerTypes[0], 'first_name', questions.addEmployee1);
        const last_name = new InquirerFunctions(inquirerTypes[0], 'last_name', questions.addEmployee2);
        const emp_role = new InquirerFunctions(inquirerTypes[2], 'employee_role', questions.addEmployee3, compRoles);
        const emp_manager = new InquirerFunctions(inquirerTypes[2], 'employee_manager', questions.addEmployee4, managerNamesArr);

        if (actionChoice == "ADD") {

            Promise.all([first_name.ask(), last_name.ask(), emp_role.ask(), emp_manager.ask()]).then(prompts => {
                inquirer.prompt(prompts).then(emp_info => {

                    addEmp(emp_info, managerObjArr);
                })
            })
            //Execute code if the view by manager was chosen
        } else if (actionChoice == "VIEW BY MANAGER") {
            viewAllEmpManager(managerObjArr, managerNamesArr);

        } else {

            //perfors a promise.all to wait until inquirerfunction instances resolve
            Promise.all([first_name.ask(), last_name.ask()]).then(prompts => {
                inquirer.prompt(prompts).then(emp_info => {

                    //Executed the multiples check function delivering 
                    if (actionChoice == "UPDATE EMP ROLE") {
                        EmpMultiplesCheck(emp_info, actionChoice, compRoles);
                    } else {
                        EmpMultiplesCheck(emp_info, actionChoice);
                    }
                })
            })
        }
    })
}











