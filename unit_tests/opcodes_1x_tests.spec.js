'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js');
const RetrievedValues = require('./../RetrievedValues.js');
const opcodes_1x = require('./../Test_cases/opcodes_1x.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

const NET_PORT = 5561;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"


describe('opcodes_1x unit tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_1x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
    utils.DisplayUnitTestHeader('opcodes_1x unit tests');
    Network.testStarted = true;
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
      utils.DisplayUnitTestFooter('opcodes_1x unit tests finished');
      setTimeout(function(){
        // timeout to allow the finish text above to print
         done();
      }, 100);
		}, 100);
    });


///////////////////////////////////////////////////////////////////////////////
//
// 				Unit Tests
//


function GetTestCase_Pass_Fail() {
  var arg1, testCases = [];
  for (var a = 1; a<= 2; a++) {
    if (a == 1) {arg1 = true}
    if (a == 2) {arg1 = false}
    testCases.push({'expectedResult': arg1});
  }
  return testCases;
}



  //10 - RQNP
	//
  itParam("RQNP test ${JSON.stringify(value)}", GetTestCase_Pass_Fail(), async function (value) {
		winston.info({message: 'UNIT TEST: BEGIN RQNP test'});
    if (value.expectedResult == true) { mock_Cbus.enterSetup(0) }
    var result = await  tests.test_RQNP(RetrievedValues);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
    winston.info({message: 'UNIT TEST: RQNP ended'});
    mock_Cbus.exitSetup(0);
	})


    // 0x11 - RQMN
    //
    itParam("RQMN test ${JSON.stringify(value)}", GetTestCase_Pass_Fail(), async function (value) {
		winston.info({message: 'UNIT TEST: BEGIN RQMN test'});
    if (value.expectedResult == true) { mock_Cbus.enterSetup(0) }
    var result = await tests.test_RQMN(RetrievedValues);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
  	winston.info({message: 'UNIT TEST: RQMN ended'});
    mock_Cbus.exitSetup(0);
	})


})