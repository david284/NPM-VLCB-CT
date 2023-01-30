'use strict';
const winston = require('winston');		// use config from root instance


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared




exports.processResult = function processResult(RetrievedValues, hasTestPassed, testName, comment)
{
	if (comment == null) { comment = ""; }
	if (hasTestPassed){ 
		winston.info({message: 'MERGLCB: PASS ' +  testName + ' passed ' + comment}); 
		RetrievedValues.data.TestsPassed++;
	}else{
		winston.info({message: '\x1B[91m' + 'MERGLCB: FAIL ' +  testName + ' failed ' + comment + '\x1B[37m'});
		RetrievedValues.data.TestsFailed++;
	}
	winston.debug({message: '-'});

}


exports.decToHex = function decToHex(num, len) {return parseInt(num).toString(16).toUpperCase().padStart(len, '0');}




exports.DisplayStartDivider = function DisplayDivider(name){
		var divider = AssembleDivider(name);
        winston.info({message:divider});
    }

exports.DisplayEndDivider = function DisplayDivider(name){
		var divider = AssembleDivider(name);
        winston.info({message:divider + '\n\n'});
    }

function AssembleDivider(name){
		// target width is 80 characters
		var width = 80;
		name = ' ' + name + ' ';
		var startPadding = (width + name.length)/2;  // we want mid point plus half the name
		// padStart first argument is the total length after padding added at the start
		name = name.padStart(startPadding, '-');
		// padEnd first argument is the total length after padding added at the end
		name = name.padEnd(width, '-');
		return name;
}

