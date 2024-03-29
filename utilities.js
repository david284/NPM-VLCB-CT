'use strict';
const winston = require('winston');		// use config from root instance
const {SerialPort} = require("serialport");


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared

// add separate logger just for failures
const failLogger = winston.createLogger({
  format: winston.format.printf((info) => { return info.message;}),
  transports: [
    new winston.transports.File({ filename: './Test_Results/fails.txt', level: 'error', options: { flags: 'w' } }),
  ],
});


exports.processResult = function processResult(RetrievedValues, hasTestPassed, testName, comment)
{
  RetrievedValues.data.TestIndex++
	if (comment == null) { comment = ""; }
	if (hasTestPassed){ 
    process.stdout.write('\x1B[92m');   // bright green
		winston.info({message: 'VLCB: PASS TestIndex:' + RetrievedValues.data.TestIndex + ' ' +  testName + ' passed ' + comment}); 
    process.stdout.write('\x1B[37m');   // white
		RetrievedValues.data.TestsPassed++;
	}else{
    process.stdout.write('\x1B[91m');   // bright red
		winston.info({message: 'VLCB: FAIL TestIndex:' + RetrievedValues.data.TestIndex + ' ' +  testName + ' failed ' + comment});
    failLogger.log({ level: 'error', message: 'VLCB: FAIL TestIndex:' + RetrievedValues.data.TestIndex + ' ' +  testName + ' failed ' + comment });
    process.stdout.write('\x1B[37m');   // white
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
  winston.info({message:divider + '\n'});
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

exports.checkSerialPort = function checkSerialPort(serialPort_info) {
  var portCount = 0;
  SerialPort.list().then(ports => {
    ports.forEach(function(port) {
      portCount++
      winston.debug({message: 'utils: serial port found: ' + JSON.stringify(port)});
      winston.info({message: 'utils: serial port found: ' + JSON.stringify(port.path)});
      if (serialPort_info != undefined) {
        winston.debug({message: 'utils: checkSerialPort: ' + serialPort_info.path});
        if (serialPort_info.path == port.path) {
          winston.info({message: 'utils: Port match ' + port.path});
          serialPort_info["valid"] = true
        }
      }
    })
    winston.info({message: 'utils: serial port count: ' + portCount + '\n'});
  })
}


