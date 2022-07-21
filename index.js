const inquirer = require('inquirer');

const connection = require ("./Library/mySql");
const menuOptions = require ("./Library/menuOptions");
const questions = require ("./Library/questions");

const functions = require ("./Library/inquirer");
const queries = require ("./Library/sql_queries");

//Inquirer types:
const inquirerTypes = [
    'input', 'confirm', 'list'
]

//Begin the app calling the main menu function
mainMenu();

//Give the mainmenu options 
function mainMenu() {

    //Calling the class functions
    const menuPrompt = new functions(inquirerTypes[2], 'menuOptions', questions.menuOptions, menuOptions);
    
    //Runs a list type inquirer
    inquirer.prompt([menuPrompt.ask()]).then(operation => {

            //Grab all the roles in database
            const query1 = "SELECT role.title FROM role"
            const compRolesArrayQuery = new queries(query1);

            //general sql query to grab all the departments in the database
            const depNameQuery = "SELECT department.name FROM department";
            const depNamesArrayQuery = new queries(depNameQuery);

            switch (operation.menuChoice) {
                case menuOptions[0]:
                    return viewAllDep();

                    
                case menuOptions[1]:
                    return viewAllRoles();

                case menuOptions[2]:
                    return viewAllEmp();
                     
                case menuOptions[3]:
                    depNamesArrayQuery.queryReturnResult(addDep);
                    break;
                
                case menuOptions[4]:
                    return addRole();

                case menuOptions[5]:
                    const actionChoice1 = "ADD"
                    compRolesArrayQuery.getQueryNoRepeats(EmpInfoPrompts, actionChoice1);
                    break;

                case menuOptions[6]:
                    const actionChoice3 = "UPDATE EMP ROLE"
                    compRolesArrayQuery.getQueryNoRepeats(EmpInfoPrompts, actionChoice3);
                    break;

            }
        })
}
//View all departments
function viewAllDep() {

    const query = `SELECT department.name
                    FROM department`

    const depTable = new queries(query);

    depTable.generalTableQuery(mainMenu);
}

//View all roles
function viewAllRoles() {
    const query = `SELECT role.title, role.salary, department.name
                    FROM role
                    INNER JOIN department ON department.id = role.department_id`
    const roleTable = new queries(query);

    roleTable.generalTableQuery(mainMenu);
}

//View all the employees 
function viewAllEmp() {
    const query = `SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, department.name
                     FROM employee
                     INNER JOIN role on role.id = employee.role_id
                     INNER JOIN department on department.id = role.department_id;`

    const empTable = new queries(query);
    //this line runs the generalTableQuery() method on the queries instance declared by empTable variable.
    //Mainmenu is delivered as a parameter because it is the function that is essentially used to take user to the next step.
    empTable.generalTableQuery(mainMenu);
}
//Function that receives the input from the user and then either adds or deletes the selected employee 
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

        const first_name = new functions(inquirerTypes[0], 'first_name', questions.addEmployee1);
        const last_name = new functions(inquirerTypes[0], 'last_name', questions.addEmployee2);
        const emp_role = new functions(inquirerTypes[2], 'employee_role', questions.addEmployee3, compRoles);
        const emp_manager = new functions(inquirerTypes[2], 'employee_manager', questions.addEmployee4, managerNamesArr);

        if (actionChoice == "ADD") {

            Promise.all([first_name.ask(), last_name.ask(), emp_role.ask(), emp_manager.ask()]).then(prompts => {
                inquirer.prompt(prompts).then(emp_info => {

                    //executes add employee function passing employee ingo and manager obj arr as parameters to it
                    addEmp(emp_info, managerObjArr);
                })
            })
        } else if (actionChoice == "VIEW BY MANAGER") {
            viewAllEmpManager(managerObjArr, managerNamesArr);

        } else {

            Promise.all([first_name.ask(), last_name.ask()]).then(prompts => {
                inquirer.prompt(prompts).then(emp_info => {

                    //If else statements executed the multiples check function delivering 
                    if (actionChoice == "UPDATE EMP ROLE") {
                        EmpMultiplesCheck(emp_info, actionChoice, compRoles);
                    } else if (actionChoice == "UPDATE EMP MANAGER") {
                        EmpMultiplesCheck(emp_info, actionChoice, managerObjArr, managerNamesArr);
                    } else {
                        EmpMultiplesCheck(emp_info, actionChoice);
                    }
                })
            })
        }
    })
}
//add an employee
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

        //Loop to get the manager Id of the employee being added so that it can be added to the database
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
            mainMenu();
        })
    })
}

//Checks for multiple instances of the employee or role that is being changed
function EmpMultiplesCheck(emp_info, actionChoice, arrayNeededForNextStep) {

    console.log("You've entered employee multiples check")

    const empFirstName = emp_info.first_name;
    const empLastName = emp_info.last_name;
    const queryMultipleEmpCheck = `SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, 
                                    employee.manager_id, department.name
                                    FROM employee 
                                    INNER JOIN role on role.id = employee.role_id
                                    INNER JOIN department on department.id = role.department_id
                                    WHERE employee.first_name = (?) AND employee.last_name = (?);`

    connection.query(queryMultipleEmpCheck, [empFirstName, empLastName], function (err, res) {

        if (res.length > 1) {
            console.log("Multiple Employees Found!")
            let multipleName = [];
            for (employee of res) {
                let empStr = `${employee.id} ${employee.first_name} ${employee.last_name} ${employee.title} ${employee.name}`
                multipleName.push(empStr);
            }
            const which_employee_to_Delete = new functions(inquirerTypes[2], 'employee_delete', questions.deleteEmployee1, multipleName);

            inquirer.prompt([which_employee_to_Delete.ask()]).then(userChoice => {
                const chosenEmpInfo = userChoice.employee_delete.split(" ");
                const chosenEmpFirstName = chosenEmpInfo[1];
                const chosenEmpLastName = chosenEmpInfo[2];
                const chosenEmpID = chosenEmpInfo[0];
                const chosenEmpRole = chosenEmpInfo[3];

                if (actionChoice === "DELETE") {
                    deleteEmp(chosenEmpFirstName, chosenEmpLastName, chosenEmpID);
                } else if (actionChoice === "UPDATE EMP ROLE") {
                    updateEmpRole(chosenEmpID, arrayNeededForNextStep);
                } else if (actionChoice === "UPDATE EMP MANAGER") {
                    updateEmpManager(chosenEmpID, arrayNeededForNextStep);
                }
            })

        } else if (res[0].id == "undefined") {
            console.log("Could not find employee. Rerouted to Main Menu")
            mainMenu();

        } else {
            console.log("One Employee Found!")

            if (actionChoice === "DELETE") {
                deleteEmp(empFirstName, empLastName, res[0].id)
            } else if (actionChoice === "UPDATE EMP ROLE") {
                updateEmpRole(res[0].id, arrayNeededForNextStep);
            } else if (actionChoice === "UPDATE EMP MANAGER") {
                updateEmpManager(res[0].id, arrayNeededForNextStep);
            }
        }
    })
}   

//Updated the employees role
function updateEmpRole(employeeID, RolesArray) {
    console.log("Entered update employee role.")

    const empNewRole = new functions(inquirerTypes[2], 'employee_role', questions.updateRole, RolesArray);
    const queryGetRoleId = `SELECT role.id
                    FROM role
                    Where role.title = (?);`
    inquirer.prompt([empNewRole.ask()]).then(chosenRole => {

        connection.query(queryGetRoleId, chosenRole.employee_role, function (err, res) {
            if (err) {
                throw err
            }

            const queryUpdateRoleId = `UPDATE employee
                                            SET employee.role_id = (?)
                                            WHERE employee.id = (?)`

            const updateEmpRoleId = new queries(queryUpdateRoleId, [res[0].id, employeeID])

            updateEmpRoleId.update(mainMenu, "Employee Role Updated!");
        })
    })
}


// add an employee roll 

function addRole() {

    const queryDeps = "SELECT department.name FROM department;"
    connection.query(queryDeps, function (err, res) {

        if (err) throw err

        let depNameArr = []
        for (let i = 0; i < res.length; i++) {
            depNameArr.push(res[i].name)
        }

        const whatRole = new functions(inquirerTypes[0], 'role_to_add', questions.newRole)
        const whatSalary = new functions(inquirerTypes[0], 'role_salary', questions.salary)
        const whatdepartment = new functions(inquirerTypes[2], 'department', questions.department, depNameArr)


        Promise.all([whatRole.ask(), whatSalary.ask(), whatdepartment.ask()]).then(prompts => {
            inquirer.prompt(prompts).then(userChoices => {

                const getDepId = `SELECT department.id FROM department WHERE department.name = (?);`
                connection.query(getDepId, userChoices.department, function (err, res) {
                    if (err) {
                        throw err
                    }

                    const addRolequery = `INSERT INTO role (role.title, role.salary, role.department_id)
                                    VALUES ( (?), (?), (?));`
                    const addRole = new queries(addRolequery, [userChoices.role_to_add, userChoices.role_salary, res[0].id]);

                    addRole.update(mainMenu, "Role added!");
                })
            })
        })
    })
}

// add a department 
function addDep(depNameArr) {

    const whatDep = new functions(inquirerTypes[0], 'dep_to_add', questions.newDep)

    inquirer.prompt([whatDep.ask()]).then(userChoice => {

        const alreadyExist = depNameArr.filter(department => {

            if (department.name == userChoice.dep_to_add) return true;
        })

        if (alreadyExist.length >= 1) {
            console.log("Department Already exists!")
            a();
        } else {
            const addDepQuery = `INSERT INTO department (department.name) VALUES (?);`
            const addDep = new queries(addDepQuery, userChoice.dep_to_add);

            addDep.update(mainMenu, "Department added!");
        }
    })
}








