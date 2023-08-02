'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_Bx = require('./../opcodes/opcodes_Bx.js');
const RetrievedValues = require('./../RetrievedValues.js');



// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


// Assert style
const assert = require('chai').assert;

const NET_PORT = 5571;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_Bx tests', function(){
	const mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	const Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_Bx.opcodes_Bx(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------------ opcodes_Bx unit tests -------------------'});
		winston.info({message: '============================================================'});
		winston.info({message: ' '});


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
            winston.info({message: 'UNIT TEST: opcodes_Bx tests finished '});
            winston.debug({message: JSON.stringify(RetrievedValues.data, null, "    ") });
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

  function GetTestCase_REQEV() {
    var arg1, arg2, testCases = [];
    for (var a = 1; a< 5; a++) {
      if (a == 1) {arg1 = "00000000"}
      if (a == 2) {arg1 = "00000001"}
      if (a == 3) {arg1 = "00010000"}
      if (a == 4) {arg1 = "FFFFFFFF"}
      for (var b = 1; b < 4; b++) {
        if (b == 1) {arg2 = 0}
        if (b == 2) {arg2 = 1}
        if (b == 3) {arg2 = 255}
        testCases.push({'eventIdentifier':arg1, 'eventVariableIndex': arg2});
      }
    }
    return testCases;
  }


  // 0xB2 - REQEV
  // Format: [<MjPri><MinPri=3><CANID>]<B2><NN hi><NN lo><EN hi><EN lo><EV# >
  itParam("REQEV test ${JSON.stringify(value)}", GetTestCase_REQEV(), async function (value) {
    winston.info({message: 'UNIT TEST:: BEGIN REQEV test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(1);
    mock_Cbus.learningNode = 1;
    await tests.test_REQEV(RetrievedValues, value.eventIdentifier, value.eventVariableIndex);
    expect(tests.hasTestPassed).to.equal(true);  
    winston.info({message: 'UNIT TEST: REQEV ended'});
  })
    
})

