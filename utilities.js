'use strict';
const winston = require('winston');		// use config from root instance
const {SerialPort} = require("serialport");


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
		winston.info({message: 'VLCB: PASS ' +  testName + ' passed ' + comment}); 
		RetrievedValues.data.TestsPassed++;
	}else{
		winston.info({message: '\x1B[91m' + 'VLCB: FAIL ' +  testName + ' failed ' + comment + '\x1B[37m'});
		RetrievedValues.data.TestsFailed++;
	}

}


exports.decToHex = function decToHex(num, len) {return parseInt(num).toString(16).toUpperCase().padStart(len, '0');}


exports.DisplayUnitTestHeader = function DisplayUnitTestHeader(name){ 
  winston.info({message:' '});
  var frame = ''
  frame = frame.padStart(100, '=');
  winston.info({message: frame});
  var divider = AssembleDivider(name, '-');
  winston.info({message: divider});
  winston.info({message: frame});
}

exports.DisplayUnitTestFooter = function DisplayUnitTestFooter(name){
  var divider = AssembleDivider(name,'-');
  winston.info({message:divider});
}
  
  
exports.DisplayStartDivider = function DisplayDivider(name){
  var divider = AssembleDivider(name, '=');
  winston.info({message:divider});
}

exports.DisplayEndDivider = function DisplayDivider(name){
  var divider = AssembleDivider(name, '=');
  winston.info({message:divider + '\n\n'});
}

function AssembleDivider(name, filler){
		// target width is 80 characters
		var width = 100;
		name = ' ' + name + ' ';
		var startPadding = (width + name.length)/2;  // we want mid point plus half the name
		// padStart first argument is the total length after padding added at the start
		name = name.padStart(startPadding, filler);
		// padEnd first argument is the total length after padding added at the end
		name = name.padEnd(width, filler);
		return name;
}

function AssembleComment(text){
		// target width is 80 characters
		var width = 80;
		text = ' ' + text + ' ';
		var startPadding = (width + text.length)/2;  // we want mid point plus half the name
		// padStart first argument is the total length after padding added at the start
		text = text.padStart(startPadding, '-');
		// padEnd first argument is the total length after padding added at the end
		text = text.padEnd(width, '-');
    text = "VLCB:      COMMENT: " + text
		return text;
}

exports.DisplayComment = function DsiplayComment(text){
		var comment = AssembleComment(text);
        winston.info({message:comment});
}

exports.sleep = function sleep(timeout) {
	return new Promise(function (resolve, reject) {
		//here our function should be implemented 
		setTimeout(()=>{
			resolve();
			;} , timeout
		);
	});
};
	
exports.findCANUSB4 = function findCANUSB4(canbus4_info) {
  winston.debug({message: 'utils: CANUSB4:'});
  SerialPort.list().then(ports => {
    ports.forEach(function(port) {
      winston.debug({message: 'utils: CANUSB4: checking port: ' + JSON.stringify(port)});
      if (port.vendorId != undefined && port.vendorId.toString().toUpperCase() == '04D8' && port.productId.toString().toUpperCase() == 'F80C') {
        winston.debug({message: 'utils: CANUSB4 found ' + port.path});
        canbus4_info.path = port.path
      }
    })
  })
}

