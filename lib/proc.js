/*
* @Author: Deepak Verma
* @Date:   2015-12-11 10:28:50
* @Last Modified by:   dverma
* @Last Modified time: 2017-06-01 01:49:43
*/

/**
	name		max_length	precision
	nchar		8000		0
	float		8			53
	real		4			24
	varchar		8000		0
	nvarchar	8000		0
	varbinary	8000		0
	bit			1			1
	numeric		17			38
	sysname		256			0
	datetime	8			23
	char		8000		0
	timestamp	8			0
	smallint	2			5
	decimal		17			38
	tinyint		1			3
	bigint		8			19
	int			4			10
 */
'use strict';

const sql = require('mssql');
const errs = require('errs');
const utils = require('./utils');
const empty = require('is-empty');

class proc {


	/**
	 * [proc description]
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	 */
	constructor(options) {
		options = options || {};
		this.config = {
			user: options.user || false,										// User name to use for authentication
			password: options.password || false,								// Password to use for authentication
			server: options.host || false,										// Server to connect to. You can use 'localhost\instance' to connect to named instance
			port: options.port || 1433,											// Port to connect to (default: 1433). Don't set when connecting to named instance
			database: options.database || false,								// Database to connect to (default: dependent on server configuration)
			stream: options.stream || false,									// Stream recordsets/rows instead of returning them all at once as an argument of callback (default: false). You can also enable streaming for each request independently (request.stream = true). Always set to true if you plan to work with large amount of rows.
			requestTimeout: options.timeout || 30000,							// Request timeout in ms (default: 15000),
			connectionTimeout: options.connectionTimeout || 30000,				// Connection timeout in ms (default: 15000)
			parseJSON: options.parseJSON || false,								// Parse JSON recordsets to JS objects (default: false). For more information please see section JSON support.
			pool: {
				max: options.poolMax || 10000,									// The maximum number of connections there can be in the pool (default: 10).
				min: options.poolMin || 0,										// The minimum of connections there can be in the pool (default: 0).
				idleTimeout: options.connIdleTimeout || 30000					// The Number of milliseconds before closing an unused connection (default: 30000).
			},
			options: {
				instanceName: options.instance || undefined,					// DB instance if any
				encrypt: options.dbEncrypt || false,							// If DB connection need to be encrypted
				useUTC: options.useUTC || false									// Timezone for DB
			}
		};
		this.startDateTime = new Date();
		this.startTime = new Date().getTime();
		// constructing error container
		this.errorResponse = [];
		this.connection = false;

		// NOTE: This is good for debug
		this.debug = options.debug || false;

		if (typeof options.sqlParams === 'object') {
			this.sqlParams = options.sqlParams;
		} else if (options.sqlParams) {
			this.sqlParams = JSON.parse(options.sqlParams);
		}
		return this;
	}

	__connection() {
		const self = this;
		return new Promise((success, fail) => {
			new sql.Connection(self.config)
				.connect()
				.then((connection) => {
					self.connection = connection;
					self.connection.on('error', (err) => {
						return fail(err);
					});
					return success(true);
				})
				.catch(function(err) {
					return fail(err);
				});
		});
	}


	/**
	 * [mapdatatype description]
	 * @return {[type]} [description]
	 */
	mapdatatype(fieldname, type, param) {
		const self = this;
		var myType, result,
			stringTypeArray = ['VarChar', 'NVarChar', 'Date'],
			objectTypeArray = ['SmallDateTime', 'DateTime', 'DateTime2'];

		if (stringTypeArray.indexOf(type) !== -1) {
			myType = 'string';
		} else if (type === 'Bit') {
			myType = 'boolean';
		} else if (objectTypeArray.indexOf(type) !== -1) {
			myType = 'object';
		} else if (type === 'Float' || type === 'Int' || type === 'SmallInt') {
			myType = 'number';
		}

		try {
			result = utils[type](param, fieldname);
		}
		catch (err) {
			self.errorResponse.push(err);
			self.errorResponse.push(type + ' is of invalid datatype');
			return false;
		}

		if (result.status) {
			if (typeof result.param === myType) {
				return { status: true, myparam: result.param };
			} else {
				self.errorResponse.push(fieldname + ' is of invalid datatype');
				return false;
			}
		} else {
			self.errorResponse.push(result.error);
			return false;
		}
	};

	/**
	 * [execute description]
	 * @param  {[type]} params [description]
	 * @return {[type]}        [description]
	 */
	execute(params) {
		const self = this;
		return new Promise((success, fail) => {
			if (!self.connection) {
				return fail(errs.create({
					title: 'sqlConnectionError',
					message: 'Unable to connect to SQL Server using provided config',
					parameters: self.config
				}));
			}

				// Initialize request first
			const dataRequest = new sql.Request(self.connection);

			// NOTE: This is good for debug
			dataRequest.verbose = self.debug;

			self.sqlParams.input
				.map(data => {
					if (empty(params[data.fieldname]) && data.isNull === true) {
						dataRequest.input(data.fieldname, sql[data.datatype](data.length), params[data.fieldname]);
					} else if (empty(params[data.fieldname]) && data.isNull === false) {
						self.errorResponse.push(data.fieldname + ' is invalid . Passed value: ' + params[data.fieldname]);
					} else {
						const check = self.mapdatatype(data.fieldname, data.datatype, params[data.fieldname]);
						if (check) {
							dataRequest.input(data.fieldname, sql[data.datatype](data.length), check.myparam);
						}
					}
				});
			// construct output params now
			self.sqlParams.output
				.map(data => {
					dataRequest.output(data.fieldname, sql[data.datatype](data.length));
				});

			// if we have error don't execute just return all the errors back
			if (self.errorResponse.length > 0) {
				// we need to close connection now
				return fail({ code: 'Error', detail: self.errorResponse });
			}

			dataRequest.execute(self.sqlParams.storedProcedure, (err, recordset) => {

				var result = [];

				// If error occurs
				if (err) {
					return fail(errs.merge(err, {
						title: 'sqlExecutionError',
						message: 'Unable to execute stored stored procedure',
						parameters: self.sqlParams.storedProcedure
					}));
				}

				// if we get any kind of sql error fail back with the error
				if (dataRequest.parameters.errorMsg.value.length) {
					return fail(dataRequest.parameters.errorMsg);
				}

				if (recordset && recordset[0]) {
					if (recordset[0].length > 0) {
						recordset[0].forEach(function(data) {
							result.push(data);
						});
					}
				}

				if (self.sqlParams.output) {
					self.sqlParams.output.forEach(function(data) {

						if (data.fieldname === 'errorMsg') {
							return;
						}

						result.push(dataRequest.parameters[data.fieldname]);
					});
				}

				return success(result);
			}); // END EXECUTE
		}); // END PROMISES
	};

	/**
	 * [constructTable description]
	 * @param  {[type]} params [description]
	 * @return {[type]}        [description]
	 */
	constructTable(params) {
		const self = this;
		// Initiate instance of sql table
		const thisTempTable = new sql.Table();

		// construct input table now
		self.sqlParams.input
			.map(data => {
				thisTempTable.columns.add(data.fieldname, sql[data.datatype](data.length));
			});

		// Add rows
		// Need to push array of an array here so we can loop through and fo sanity check
		// Example :- [{a: 1, b: 2, c: 3},{a: 1, b: 2, c: 3},{a: 1, b: 2, c: 3}]
		params.map(row => {
			const inputVals = [];
			// construct input params now
			self.sqlParams.input.map(data => {
				var present = false;
				if (empty(row[data.fieldname]) && data.isNull === true) {
					present = true;
					inputVals.push(row[data.fieldname]);
				} else if (empty(row[data.fieldname]) && data.isNull === false) {
					self.errorResponse.push(data.fieldname + ' is invalid . Passed value: ' + row[data.fieldname]);
				} else {
					const check = self.mapdatatype(data.fieldname, data.datatype, row[data.fieldname]);
					if (check) {
						present = true;
						inputVals.push(check.myparam);
					}
				}
				// If this its required and not present
				if (data.required && !present) {
					self.errorResponse.push(data.fieldname + ' is missing from input params');
					present = false;
				}
			});
			thisTempTable.rows.push(inputVals);
		});
		return thisTempTable;
	};

	/**
	 * [executebulk execute bulk insert table]
	 * @param  {[type]} options [description]
	 * @return {[type]}         [description]
	 */
	executebulk(options) {
		const self = this;
		return new Promise(function(success, fail) {
			const params = (options.params) ? options.params : [];
				// If error occurs
			if (!self.connection) {
				return fail(errs.create({
					title: 'sqlConnectionError',
					message: 'Unable to connect to SQL Server using provided config',
					parameters: self.config
				}));
			}

			// Initialize request first
			const dataRequest = new sql.Request(self.connection);

			// Construct the temptable now
			const tempTable = self.constructTable(params);
			// NOTE: This is good for debug
			dataRequest.verbose = self.debug;
			// set the table as input params
			dataRequest.input(options.tableName, tempTable);

			self.sqlParams.output
				.map(data => {
					dataRequest.output(data.fieldname, sql[data.datatype](data.length));
				});

			// if we have error don't execute just return all the errors back
			if (self.errorResponse.length > 0) {
				// we need to close connection now
				return fail({ code: 'Error', detail: self.errorResponse });
			}
			dataRequest.execute(self.sqlParams.storedProcedure, (err, recordset) => {
				const result = [];

				if (err) {
					return fail(errs.merge(err, {
						title: 'sqlExecutionError',
						message: 'Unable to execute stored stored procedure',
						parameters: self.sqlParams.storedProcedure
					}));
				}
				// if we get any kind of sql error fail back with the error
				if (dataRequest.parameters.errorMsg.value.length) {
					return fail(dataRequest.parameters.errorMsg);
				}

				if (recordset && recordset[0]) {
					if (recordset[0].length > 0) {
						recordset[0].forEach(function(data) {
							result.push(data);
						});
					}
				}

				if (self.sqlParams.output) {
					self.sqlParams.output.forEach(function(data) {
						if (data.fieldname === 'errorMsg') {
							return;
						}
						result.push(dataRequest.parameters[data.fieldname]);
					});
				}
				return success(result);
			});// END EXECUTE
		}); // END PROMISE
	};
}
module.exports = proc;
