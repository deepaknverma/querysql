/*
* @Author: Deepak Verma
* @Date:   2015-12-11 10:34:20
* @Last Modified by:   Deepak Verma
* @Last Modified time: 2015-12-14 11:36:14
*/

'use strict';

var proc = require('./lib');

/**
 * Return the version number of the module.
 *
 * @readonly
 * @alias module: getprovider.version
 * @type Number
 */
proc.version = require('./package.json').version;

module.exports = proc;
