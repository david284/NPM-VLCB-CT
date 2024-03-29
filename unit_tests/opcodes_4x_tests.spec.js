'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_4x = require('./../Test_cases/opcodes_4x.js');
const RetrievedValues = require('./../RetrievedValues.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

const NET_PORT = 5564;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_4x unit tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_4x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
    utils.DisplayUnitTestHeader('opcodes_4x unit tests');
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
      utils.DisplayUnitTestFooter('opcodes_4x unit tests finished');
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
  

	// 0x42 - SNN
    //
    itParam("SNN test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST: BEGIN SNN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber( value.nodeNumber );
    if (value.expectedResult == true) { mock_Cbus.enterSetup(0) }
    var result = await tests.test_SNN(RetrievedValues);
    winston.info({message: 'UNIT TEST: SNN ended'});
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
	})

  
    // 0x4F - NNRSM
    itParam("NNRSM test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NNRSM test'});
		RetrievedValues.setNodeNumber( value.nodeNumber );
    var result = await tests.test_NNRSM(RetrievedValues);
    winston.info({message: 'UNIT TEST: NNRSM ended'});
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
	})




})