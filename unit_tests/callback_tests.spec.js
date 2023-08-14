'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const callback_tests = require('./../Tests_callback.js');
const RetrievedValues = require('./../RetrievedValues.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;

const NET_PORT = 5559;
const NET_ADDRESS = "127.0.0.1"

describe('callback unit tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const callback = new callback_tests.callbackTests(Network);

	before(function() {
    utils.DisplayUnitTestHeader('callback unit tests');
	})
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      utils.DisplayUnitTestFooter('callback unit tests finished');
      setTimeout(function(){
        // timeout to allow the finish text above to print
        done();
      }, 100);
		}, 100);
  });


///////////////////////////////////////////////////////////////////////////////
//
// 						Testing examples tests
//


    function GetTestCase_HEARTB() {
		var arg1, arg2, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) arg1 = 0;
			if (a == 2) arg1 = 1;
			if (a == 3) arg1 = 65535;
			for (var b = 1; b< 3; b++) {
				if (b == 1) {arg2 = arg1;}
				if (b == 2) {arg2 = 3;}
				testCases.push({'nodeNumber':arg1, 'expectedNumber':arg2});
			}
		}
		return testCases;
	}



	// 0x42 - HEARTB
    //
    itParam("HEARTB test ${JSON.stringify(value)}", GetTestCase_HEARTB(), function (done, value) {
		winston.info({message: 'UNIT TEST: BEGIN HEARTB test'});
		RetrievedValues.setNodeNumber(value.expectedNumber);
		callback.attach(RetrievedValues);					// attach callback to receive HEARTB
    mock_Cbus.outputHEARTB(value.nodeNumber);			// transmit HEARTB
		setTimeout(function(){
			if (value.nodeNumber == value.expectedNumber){
				expect(RetrievedValues.retrieved_values.HEARTB).to.equal('passed');
				winston.debug({message: 'UNIT TEST: HEARTB expected passed - result ' + RetrievedValues.retrieved_values.HEARTB});
			} else {
				expect(RetrievedValues.retrieved_values.HEARTB).to.equal('failed');
				winston.debug({message: 'UNIT TEST: HEARTB expected failed - result ' + RetrievedValues.retrieved_values.HEARTB});
			}
			winston.info({message: 'UNIT TEST: END HEARTB test'});
			done();
		}, 100);
	})




})