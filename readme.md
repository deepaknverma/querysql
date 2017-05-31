querysql
=============
A node wrapper to run any Sql Server stored procedure driven by `parameter.json`. 

REQUIRE
========
	
**Parameter.json** : parameter.son define the data structure of your sql server stored procedure. It is divided into three sections defined below:

* **Input**: All the input fields required by the stored procedure
	* **fieldname**: name of the table field required input parameter `example: providerCode` 
	* **datatype**: datatype for field value `example: VarChar, int etc ` 
	* **required**: `(true/false)` required field input parameter to not
	
			{
		 		"input": [{
					"fieldname" : "providerCode", 
					"datatype": "VarChar",
					"required": true
	    			},
	    			{
					"fieldname" : "providerType", 
					"datatype": "VarChar",
					"required": false
				}],
				"output": [{
					"fieldname" : "errorMsg", 
					"datatype": "VarChar",
					"length": 1000,
					"required": true
	    			}],
				"storedProcedure": "app.proc_getProviderByCode"
			}


USAGE:
========
It would be better to define your data structure in a JSON file to keep things simple, clean and easy to edit. You can then either read from the file 	and pass to the module. This file *(defined above)* is very important for the module to run as it tells the module how your table structure looks like and how to perform validation.

After this all you need to do is pass the database configuration with this JSON file in it. First initialise the class with the config and then call the execute method with the input values.

**NOTE: It is very important that the input value key matches the fieldname in the JSON file.**

	var fs = require('fs');
	var dataStructure = fs.readFileSync(__dirname + '/../parameters.json', 'UTF-8');

	// Constructing DB config object to initalize connection
	var dbconfig = {
		user: 'admin',
		password: 'admin@123',
		host: '127.0.0.1',
		port: 1433,
		db: 'test',
		instance: 'test',
		sqlParams: dataStructure
	};
	var provider = new proc(dbconfig);

	// execute the method now
	provider.execute(params)
	.then(function(data) {
		console.log(data);
	})
	.catch(function(error) {
		console.log(error);
	}); 



ARGUMENTS
===========

* **dbconfig** : database configuration
	* **user**: database username
	* **password**: database password
	* **host**:  database hostname
	* **port**: database port
	* **db**:  database name
	* **instance**: database instance
	* **sqlParams**: sql data structure 

* **params** : input parameter object

TESTS
======
Both unit and integration tests are supported and you can either run all or a subset of tests.

	# run all tests (unit and integration)
	$ npm run test
	# or
	$ mocha test

	# run all unit tests
	$ mocha test/unit

	# run a subset of unit tests
	$ npm run unit-grep grep=test-case

	# run all integration tests
	$ npm run integration

	# run mocha with coverage
	$ npm run cover
	
DOCUMENTATION
===============
You can rebuild this documentation by running the below which extracts all JSDoc annotations for .js files found within lib.

	$ npm run docs

TODO
=====
* More Validation required
