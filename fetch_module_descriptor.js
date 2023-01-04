'use strict';
const winston = require('winston');		// use config from root instance
const jsonfile = require('jsonfile')

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


//
// fetch_module_descriptor
//
// Synchronous file read, so will block execution till completed, so no timeouts needed
// input - json array with values retrieved from module under test
//
exports.module_descriptor = function module_descriptor(retrieved_values)
{
	
	try {
		winston.debug({message: `MERGLCB: retrieved_values : ${JSON.stringify(retrieved_values)}`});
		// use values retrieved from module to create filename
		var filename = retrieved_values["NAME"] + '_' + 
		retrieved_values["Manufacturer’s Id"] + '_' + 
		retrieved_values["Major Version"] + '_' + 
		retrieved_values["Minor Version"] +
		'.json';

		const module_descriptor = jsonfile.readFileSync('./module_descriptors/' + filename)
		winston.info({message: `MERGLCB: module descriptor file read succesfully : ` + filename});
		return module_descriptor;
	} catch (err) {
		winston.debug({message: `MERGLCB: module descriptor file read failed : ` + err});
		winston.info({message: `MERGLCB: failed to read module descriptor file : ` + filename});
	}
	winston.debug({message: '-'});
}
