'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_5x = require('./../Test_cases/opcodes_5x.js');
const RetrievedValues = require('./../RetrievedValues.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared

const NET_PORT = 5565;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"


describe('opcodes_5x unit tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_5x(Network);

	before(function() {
    utils.DisplayUnitTestHeader('opcodes_5x unit tests');
    Network.testStarted = true;
    RetrievedValues.data.unitTestsRunning = true;
	})
    
  beforeEach (function() {
    winston.info({message: ' '});   // blank line to separate tests
    Network.messagesIn = [];
  })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      winston.debug({message: 'UNIT TEST: RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, "    ")});
      utils.DisplayUnitTestFooter('opcodes_5x unit tests finished');
      setTimeout(function(){
        // timeout to allow the finish text above to print
        done();
      }, 10);
		}, 10);
  });


  ///////////////////////////////////////////////////////////////////////////////
  //
  // 				Tests
  //

  //
  // most of the opcodes in this section have a single nodeNumber parameter, so can use this common testcase structure
  //
  function GetTestCase_NodeNumber() {
    var arg1, arg2, testCases = [];
    for (var a = 1; a<= 4; a++) {
      if (a == 1) {arg1 = 0, arg2 = true}
      if (a == 2) {arg1 = 1, arg2 = true}
      if (a == 3) {arg1 = 65535, arg2 = true}
      if (a == 4) {arg1 = 2, arg2 = false}
      testCases.push({'nodeNumber':arg1, 'expectedResult': arg2});
    }
    return testCases;
  }
  

  // 0x50 RQNN
  // need to use a timeout here, as we send a RQNN from the mock_cbus, and need to wait for it to be received
  // 
  itParam("RQNN test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), function (done, value) {
		winston.info({message: 'UNIT TEST: BEGIN RQNN test ' + JSON.stringify(value)});
    mock_Cbus.enterSetup(value.nodeNumber);
		var retrieved_values = {};
		setTimeout(function(){
			tests.checkForRQNN(RetrievedValues);
      expect(tests.inSetupMode).to.equal(value.expectedResult);
      if (value.expectedResult == true) { expect(tests.test_nodeNumber).to.equal(value.nodeNumber) }
      winston.info({message: 'UNIT TEST: RQNN ended'});
      mock_Cbus.exitSetup(value.nodeNumber);
			done();
		}, 10);
	})


	// 0x53 - NNLRN
	itParam("NNLRN test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NNLRN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
		var result = await tests.test_NNLRN(RetrievedValues);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END NNLRN test'});
	})
  
  
	// 0x54 - NNULN
	itParam("NNULN test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NNULN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
		var result = await tests.test_NNULN(RetrievedValues);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END NNULN test'});
	})
  
  
	// 0x55 - NNCLR
	itParam("NNCLR test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NNCLR test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
		var result = await tests.test_NNCLR(RetrievedValues);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END NNCLR test'});
	})
  
  
	// 0x56 - NNEVN
	itParam("NNEVN test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NNEVN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
		var result = await tests.test_NNEVN(RetrievedValues, 1);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END NNEVN test'});
	})
  
  
	// 0x57 - NERD
	itParam("NERD test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NERD test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
		var result = await tests.test_NERD(RetrievedValues);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END NERD test'});
	})
  
  
	// 0x57 - RQEVN
	itParam("RQEVN test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN RQEVN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
		var result = await tests.test_RQEVN(RetrievedValues);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END RQEVN test'});
	})
  
  
	// 0x5D - ENUM
	itParam("ENUM test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN ENUM test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
		var result = await tests.test_ENUM(RetrievedValues);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END ENUM test'});
	})
	

	// 0x5E - NNRST
	itParam("NNRST test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NNRST test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
		// NNRST - node reset - check the uptime values after reset to see if the unit has actually reset
		// so need to pass in the service index for the MNS service - 1 in this case
		var result = await tests.test_NNRST(RetrievedValues, 1);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END NNRST test'});
	})
	
})

