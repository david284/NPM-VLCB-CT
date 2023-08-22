'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_0x = require('./../Test_cases/opcodes_0x.js');
const RetrievedValues = require('./../RetrievedValues.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

const NET_PORT = 5560;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_0x unit tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_0x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
    utils.DisplayUnitTestHeader('opcodes_0x unit tests');
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
      utils.DisplayUnitTestFooter('opcodes_0x unit tests finished');
      setTimeout(function(){
        // timeout to allow the finish text above to print
        done();
      }, 50);
		}, 50);
  });



///////////////////////////////////////////////////////////////////////////////
//
// 				Tests
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


    // 0x0D - QNN
    itParam("QNN test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST: BEGIN QNN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);    // sets node number of expected response
    var result = await tests.test_QNN(RetrievedValues);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
    winston.info({message: 'UNIT TEST: QNN ended'});
	})




})