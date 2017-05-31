/*
* @Author: Deepak Verma
* @Date:   2015-09-23 09:30:12
* @Last Modified by:   dverma
* @Last Modified time: 2016-03-23 11:37:46
*/

'use strict';
var validator 	= require('validator'),
	moment = require('moment'),
	processVal;

processVal = {

	DateTime: function(value, fieldname) {
		// is it a valid date
		if (validator.isDate(value)) {
			// convert param into datetime
			value = new Date(value);
			return { status: true, param: value };
		} else {
			return { status: false, error: fieldname + ' is invalid date(YYYY-MM-dd). Passed value: ' + value };
		}
	},
	DateTime2: function(value, fieldname) {
		// is it a valid date
		if (validator.isDate(value)) {
			// convert param into datetime
			value = new Date(value);
			return { status: true, param: value };
		} else {
			return { status: false, error: fieldname + ' is invalid date(YYYY-MM-dd). Passed value: ' + value };
		}
	},
	Date: function(value, fieldname) {
		// is it a valid date
		if (validator.isDate(value)) {
			// convert param into datetime
			value = moment(new Date(value)).format('YYYY-MM-DD');
			return { status: true, param: value };
		} else {
			return { status: false, error: fieldname + ' is invalid date(YYYY-MM-dd). Passed value: ' + value };
		}
	},
	SmallDateTime: function(value, fieldname) {
		// is it a valid date
		if (validator.isDate(value)) {
			// convert param into datetime
			value = new Date(value);
			return { status: true, param: value };
		} else {
			return { status: false, error: fieldname + ' is invalid date(YYYY-MM-dd). Passed value: ' + value };
		}
	},
	Int: function(value, fieldname) {
		if (typeof value === 'number') {
			return { status: true, param: parseInt(value) };
		} else if (validator.isNumeric(value.toString())) {
			return { status: true, param: parseInt(value) };
		} else {
			return { status: false, error: fieldname + ' is invalid number. Passed value: ' + value };
		}
	},
	SmallInt: function(value, fieldname) {
		if (typeof value === 'number') {
			return { status: true, param: parseInt(value) };
		} else if (validator.isNumeric(value.toString())) {
			return { status: true, param: parseInt(value) };
		} else {
			return { status: false, error: fieldname + ' is invalid number. Passed value: ' + value };
		}
	},
	Float: function(value, fieldname) {
		if (value % 1 !== 0 || value.toString().indexOf('.') !== -1 || !isNaN(parseFloat(value))) {
			return { status: true, param: parseFloat(value) };
		} else {
			return { status: false, error: fieldname + ' is invalid float. Passed value: ' + value };
		}
	},
	VarChar: function(value, fieldname) {
		if (typeof value === 'string') {
			return { status: true, param: value };
		} else {
			return { status: false, error: fieldname + ' is invalid VarChar. Passed value: ' + value };
		}
	},
	NVarChar: function(value, fieldname) {
		if (typeof value === 'string') {
			return { status: true, param: value };
		} else {
			return { status: false, error: fieldname + ' is invalid VarChar. Passed value: ' + value };
		}
	},
	Bit: function(value, fieldname) {
		if (typeof value === 'boolean') {
			return { status: true, param: value };
		} else {
			return { status: false, error: fieldname + ' is invalid boolean. Passed value: ' + value };
		}
	}
};

module.exports = processVal;
