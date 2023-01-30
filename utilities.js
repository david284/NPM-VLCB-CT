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
		winston.info({message: 'MERGLCB: ' +  testName + ' passed ' + comment}); 
		RetrievedValues.data.TestsPassed++;
	}else{
		winston.info({message: '\x1B[91m' + 'MERGLCB: ' +  testName + ' failed ' + comment + '\x1B[37m'});
		RetrievedValues.data.TestsFailed++;
	}
	winston.debug({message: '-'});

}


exports.decToHex = function decToHex(num, len) {return parseInt(num).toString(16).toUpperCase().padStart(len, '0');}

