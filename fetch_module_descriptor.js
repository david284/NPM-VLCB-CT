'use strict';
const winston = require('winston');		// use config from root instance
const jsonfile = require('jsonfile')

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

var Template = 
{
	"NAME" : "",
	"nodeParameters": {
		"0": {
			"name" : "Number of parameters",
		},
		"1": {
			"name" : "Manufacturer’s Id",
		},
		"2": {
			"name" : "Minor Version",
		},
		"3": {
			"name" : "Module Type",
		},
		"4": {
			"name" : "No. of events supported",
		},
		"5": {
			"name" : "No. of Event Variables per event",
		},
		"6": {
			"name" : "No. of Node Variables",
		},
		"7": {
			"name" : "Major Version",
		},
		"8": {
			"name" : "Flags",
		}
	},
	"services": {
	}
}




//
// fetch_module_descriptor
//
// Synchronous file read, so will block execution till completed, so no timeouts needed
// param 1 - file path to use
// param 2 - json array with values retrieved from module under test
//
exports.module_descriptor = function module_descriptor(file_path, retrieved_values)
{
	var module_descriptor;
	
	try {
		winston.debug({message: `MERGLCB: retrieved_values : ${JSON.stringify(retrieved_values)}`});
		// use values retrieved from module to create filename
		var filename = retrieved_values["NAME"] + '_' + 
		retrieved_values["nodeParameters"]["1"] + '_' + 
		retrieved_values["nodeParameters"]["7"] + '_' + 
		retrieved_values["nodeParameters"]["2"] +
		'.json';

		module_descriptor = jsonfile.readFileSync(file_path + filename)
		winston.info({message: `MERGLCB: module descriptor file read succesfully : ` + filename});
		return module_descriptor;
	} catch (err) {
		winston.debug({message: `MERGLCB: module descriptor file read failed : ` + err});
		module_descriptor = Template;
		module_descriptor.NAME = retrieved_values["NAME"];
		
		winston.info({message: `MERGLCB: failed to read module descriptor file : ` + filename});
		return module_descriptor;
	}
	winston.debug({message: '-'});
}
