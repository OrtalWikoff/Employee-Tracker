const mysql = require ("mysql2");
const connection = require ("./mySql");

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

    //This method exists just so I could console.log a different message.  It is a bit redundant
    //Then it will navigate to a next function that is delivered as a parameter.
    delete(next) {

        connection.query(this.query, this.values, function (err, res) {
            if (err) throw err
            
            console.log("Delete Successful!");

            next();
        })
    }

    //This function will run an update based on the delivered query and values
    //Then it will navigate to a next and console.log a message that are delivered as parameters.
    update(next, message) {

        connection.query(this.query, this.values, function (err, res) {
            if (err) throw err
            console.log(message);

            next();
        })

    };

    //queryReturnResult() is a method in my queries class that will run a query and return the result
    // to the function delivered as the parameter
    queryReturnResult(next) {
        connection.query(this.query, this.values, function (err, res) {
            if (err) throw err
            
            next(res);
        })
    }
}


module.exports = queries;