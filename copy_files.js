'use strict';
const winston = require('./config/winston.js');
const fs = require('fs');
const AdmZip = require("adm-zip");

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared




exports.copyFiles = function copyFiles(identity)
{
  const zip = new AdmZip();
  
	// create test results folder
	var foldername = './Test_Results/';

	try {
		if (!fs.existsSync(foldername)) {
		fs.mkdirSync(foldername)
	}
	} catch (err) {
		console.error(err)
	}

	// create module folder
	foldername = './Test_Results/' + identity + '/';

	try {
		if (!fs.existsSync(foldername)) {
      fs.mkdirSync(foldername)
    }
	} catch (err) {
		console.error(err)
	}


	// now create timestamp
	const date = new Date()
	const timestamp = date.toISOString().substring(0, 10)
			+ '  ' + date.getHours()
			+ '-' + date.getMinutes()
			+ '-' + date.getSeconds();

  // create filename
  const outputFile = identity + '  ' + timestamp + "  test results.zip";

  try {
    zip.addLocalFile('./Test_Results/Retrieved Values.txt')
    zip.addLocalFile('./Test_Results/debug.log')
    zip.addLocalFile('./Test_Results/TestReport.txt')
    zip.writeZip(foldername+outputFile);
  }catch (err) {
		console.error(err)
	}


	winston.info({message: '\nVLCB: a copy of the results has been saved in folder ' + foldername});

}
