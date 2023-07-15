'use strict';
const winston = require('./config/winston.js');
const fs = require('fs');


exports.copyFiles = function copyFiles(identity)
{

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

	// now create timestamp folder
	const date = new Date()
	const timestamp = date.toISOString().substring(0, 10)
			+ '-' + date.getHours()
			+ '-' + date.getMinutes()
			+ '-' + date.getSeconds();
	foldername = './Test_Results/' + identity + '/' + timestamp + '/';
	
	try {
		if (!fs.existsSync(foldername)) {
		fs.mkdirSync(foldername)
	}
	} catch (err) {
		console.error(err)
	}


	var source = './Test_Results/Retrieved Values.txt';
	var destination = foldername + 'Retrieved Values.txt';
	fs.copyFile(source, destination, (err) => {
		if (err) throw err;
	});

	var source = './Test_Results/debug.log';
	var destination = foldername + 'debug.log';
	fs.copyFile(source, destination, (err) => {
		if (err) throw err;
	});

	var source = './Test_Results/TestReport.txt';
	var destination = foldername + 'TestReport.txt';
	fs.copyFile(source, destination, (err) => {
		if (err) throw err;
	});

	winston.info({message: '\nVLCB: a copy of the results has been saved in folder ' + foldername});

}
