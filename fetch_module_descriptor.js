'use strict';
const winston = require('winston');		// use config from root instance
const jsonfile = require('jsonfile')
const fs = require('fs');
const utils = require('./utilities.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


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
		var Title = 'Fetch Module Descriptor';
	
		utils.DisplayStartDivider(Title);
	
	try {
		
		winston.debug({message: `MERGLCB: Fetch_Module_descriptor: RetrievedValues : ${JSON.stringify(RetrievedValues.data, null, "    ")}`});
		// use values retrieved from module to create Module descriptor Identity
		
		RetrievedValues.data["DescriptorIdentity"] = "CAN" + RetrievedValues.data["NAME"].trimEnd() + '-' + 
		utils.decToHex(RetrievedValues.data["nodeParameters"]["1"].value, 2) +					// manufacturerID in hex
		utils.decToHex(RetrievedValues.data["nodeParameters"]["3"].value, 2) + 					// moduleID in hex
		'-' +
		RetrievedValues.data["nodeParameters"]["7"].value + 									// major version in decimal
		String.fromCharCode(RetrievedValues.data["nodeParameters"]["2"].value);					// minor version as ascii character
		
		// now create filename from DescriptorIdentity
		var filename = RetrievedValues.data["DescriptorIdentity"] + '.json';
		winston.info({message: `MERGLCB: module descriptor filename : ` + filename});

		module_descriptor = jsonfile.readFileSync(file_path + filename)
		winston.info({message: `MERGLCB: module descriptor file read succesfully : ` + filename});
		utils.DisplayEndDivider(Title + ' finished');
		return module_descriptor;
	} catch (err) {
		winston.debug({message: `MERGLCB: module descriptor file read failed : ` + err});
		winston.debug({message: `MERGLCB: Building new module_descriptor : `});
		// build the module_descriptor json
		module_descriptor = {};
		module_descriptor["NAME"] = RetrievedValues.data["NAME"];
		module_descriptor["nodeParameters"] = {};
		
		for (var key in RetrievedValues.data["nodeParameters"]) {
			winston.debug({message: `MERGLCB: Key ` + JSON.stringify(key) + " " + RetrievedValues.data["nodeParameters"][key].value});
			module_descriptor["nodeParameters"][key] = {};
			module_descriptor["nodeParameters"][key]["name"] = RetrievedValues.data["nodeParameters"][key].name;
			module_descriptor["nodeParameters"][key]["value"] = RetrievedValues.data["nodeParameters"][key].value;
		}
		
		// now write it to disk
		var text = JSON.stringify(module_descriptor, null, '    ');
		fs.writeFileSync(file_path + filename, text);
				
		winston.info({message: `MERGLCB: New module descriptor file created : ` + filename +'\n'});

		utils.DisplayEndDivider(Title + ' finished');
		return module_descriptor;
	}
}
