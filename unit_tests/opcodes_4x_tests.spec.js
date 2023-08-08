'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_4x = require('./../opcodes/opcodes_4x.js');
const RetrievedValues = require('./../RetrievedValues.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


// Assert style
const assert = require('chai').assert;

const NET_PORT = 5564;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_4x tests', function(){
	const mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	const Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_4x.opcodes_4x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------------ opcodes_4x unit tests -------------------'});
		winston.info({message: '============================================================'});
		winston.info({message: ' '});
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
      winston.info({message: ' '});   // blank line to separate tests
      winston.info({message: '------------------------------------------------------------'});
      winston.debug({message: 'UNIT TEST: RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, "    ")});
      //                      012345678901234567890123456789987654321098765432109876543210
      winston.info({message: '-------------- opcodes_4x unit tests finished --------------'});
      winston.info({message: '------------------------------------------------------------'});
      setTimeout(function(){
        // timeout to allow the finish text above to print
        done();
      }, 100);
		}, 100);
    });


  ///////////////////////////////////////////////////////////////////////////////
  //
  // 				Tests
  //

  //
  // most of the opcodes in this section have a single nodeNumber parameter, so can use this common testcase structure
  //
  function GetTestCase_NodeNumber() {
		var arg1, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) arg1 = 0;
			if (a == 2) arg1 = 1;
			if (a == 3) arg1 = 65535;
			testCases.push({'nodeNumber':arg1});
		}
		return testCases;
	}


	// 0x42 - SNN
    //
    itParam("SNN test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST: BEGIN SNN test'});
		RetrievedValues.setNodeNumber( value.nodeNumber );
    mock_Cbus.enterSetup(0);
    await tests.test_SNN(RetrievedValues);
    winston.info({message: 'UNIT TEST: SNN ended'});
    expect(tests.hasTestPassed).to.equal(true);
    mock_Cbus.exitSetup(0);
	})

  
    // 0x4F - NNRSM
    itParam("NNRSM test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NNRSM test'});
		RetrievedValues.setNodeNumber( value.nodeNumber );
    await tests.test_NNRSM(RetrievedValues);
    winston.info({message: 'UNIT TEST: NNRSM ended'});
    expect(tests.hasTestPassed).to.equal(true);
	})




})