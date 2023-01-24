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
exports.module_descriptor = function module_descriptor(file_path, RetrievedValues)
{
	var module_descriptor;
	
		winston.debug({message: ' '});
		//                       012345678901234567890123456789987654321098765432109876543210
		winston.debug({message: '============================================================'});
		winston.info({message:  '----------------- Fetch_Module_descriptor ------------------'});
		winston.debug({message: '============================================================'});
		winston.debug({message: ' '});
	
	try {
		
		winston.debug({message: `MERGLCB: Fetch_Module_descriptor: RetrievedValues : ${JSON.stringify(RetrievedValues.data, null, "    ")}`});
		// use values retrieved from module to create filename
		var filename = RetrievedValues.data["NAME"] + '_' + 
		RetrievedValues.data["nodeParameters"]["1"] + '_' + 
		RetrievedValues.data["nodeParameters"]["7"] + '_' + 
		RetrievedValues.data["nodeParameters"]["2"] +
		'.json';
		winston.info({message: `MERGLCB: module descriptor filename : ` + filename +'\n'});

		module_descriptor = jsonfile.readFileSync(file_path + filename)
		winston.info({message: `MERGLCB: module descriptor file read succesfully : ` + filename +'\n'});
		return module_descriptor;
	} catch (err) {
		winston.debug({message: `MERGLCB: module descriptor file read failed : ` + err});
		winston.debug({message: `MERGLCB: Building new module_descriptor : `});
		module_descriptor = Template;
		module_descriptor.NAME = RetrievedValues.data["NAME"];
		
		for (var key in RetrievedValues.data["nodeParameters"]) {
			winston.debug({message: `MERGLCB: Key ` + JSON.stringify(key) + " " + RetrievedValues.data["nodeParameters"][key]});
			module_descriptor["nodeParameters"][key]["value"] = RetrievedValues.data["nodeParameters"][key];
		}
		
		// now write it to disk
		jsonfile.writeFile(file_path + filename, module_descriptor);
		
		winston.info({message: `MERGLCB: New module descriptor file created : ` + filename +'\n'});
		return module_descriptor;
	}
}
