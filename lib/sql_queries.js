const mysql = require ("mysql2");
const connection = require ("./mySql");
const asTable = require('as-table').configure({ delimiter: ' | ', dash: '-' });

class queries {
    constructor(query, values) {
        this.query = query;
        this.values = values;
    }

    //Run a query based on delivered query and values 
    generalTableQuery(next) {
        connection.query(this.query, this.values, function (err, res) {
            if (err) throw err
    //results
            console.log(asTable(res));
            next();
        })
    }

    //Return an array of the roles of the company
    getQueryNoRepeats(next, parameterToPassToNextStep) {

        connection.query(this.query, this.values, function (err, res) {
            if (err) throw err
            let titleArr = []
            for (let i = 0; i < res.length; i++) {
                if (!titleArr.includes(res[i].title)) {
                    titleArr.push(res[i].title)
                }
            }
            next(titleArr, parameterToPassToNextStep);
        })
    }

    //Update based on the delivered query and values
    update(next, message) {

        connection.query(this.query, this.values, function (err, res) {
            if (err) throw err
            console.log(message);
            next();
        })

    };

    //Run a query and return the result to the function delivered as the parameter
    queryReturnResult(next) {
        connection.query(this.query, this.values, function (err, res) {
            if (err) throw err
            next(res);
        })
    }
}

module.exports = queries;