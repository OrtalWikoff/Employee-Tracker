const mysql = require ('mysql2');

// connection to mysql

const connection = mysql.createConnection ({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "Ilovecoding!5",
    database: "Employee_Management_db"
})

module.exports = connection; 