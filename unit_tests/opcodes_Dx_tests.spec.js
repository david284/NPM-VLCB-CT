'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_Dx = require('./../opcodes/opcodes_Dx.js');
const RetrievedValues = require('./../RetrievedValues.js');



// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


// Assert style
const assert = require('chai').assert;

const NET_PORT = 5573;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_Dx tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_Dx(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------------ opcodes_Dx unit tests -------------------'});
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
      winston.info({message: '-------------- opcodes_Dx unit tests finished --------------'});
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

  function GetTestCase_EVLRN() {
    var arg1, arg2, arg3, arg4, testCases = [];
    for (var a = 1; a< 5; a++) {
      if (a == 1) {arg1 = "00000000"}
      if (a == 2) {arg1 = "00000001"}
      if (a == 3) {arg1 = "00010000"}
      if (a == 4) {arg1 = "FFFFFFFF"}
      for (var b = 1; b < 4; b++) {
        if (b == 1) {arg2 = 0}
        if (b == 2) {arg2 = 1}
        if (b == 3) {arg2 = 254}    // note 255 is used for Invalid Event Variable Index test
        for (var c = 1; c < 4; c++) {
          if (c == 1) {arg3 = 0}
          if (c == 2) {arg3 = 1}
          if (c == 3) {arg3 = 255}
          testCases.push({'eventIdentifier':arg1, 'eventVariableIndex': arg2, 'eventVariableValue': arg3});
        }
      }
    }
    return testCases;
  }


  // 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  itParam("EVLRN test ${JSON.stringify(value)}", GetTestCase_EVLRN(), async function (value) {
    winston.info({message: 'UNIT TEST:: BEGIN EVLRN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(1);
    mock_Cbus.learningNode = 1;
    await tests.test_EVLRN(RetrievedValues, value.eventIdentifier, value.eventVariableIndex, value.eventVariableValue);
    expect(tests.hasTestPassed).to.equal(true);  
    winston.info({message: 'UNIT TEST: EVLRN ended'});
  })
    

  // 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  it("EVLRN_INVALID_EVENT", async function () {
    winston.info({message: 'UNIT TEST:: BEGIN EVLRN_INVALID_EVENT test'});
		RetrievedValues.setNodeNumber(1);
    mock_Cbus.learningNode = 1;
    mock_Cbus.eventLimitReached = true;   // set to ensure error condition is met
    await tests.test_EVLRN_INVALID_EVENT(RetrievedValues, "FFF00000", 1, 1);
    expect(tests.hasTestPassed).to.equal(true);  
    winston.info({message: 'UNIT TEST: EVLRN_INVALID_EVENT ended'});
  })




  // 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  it("EVLRN_INVALID_INDEX", async function () {
    winston.info({message: 'UNIT TEST:: BEGIN EVLRN_INVALID_INDEX test'});
		RetrievedValues.setNodeNumber(1);
    mock_Cbus.learningNode = 1;
    await tests.test_EVLRN_INVALID_INDEX(RetrievedValues, "01000200", 255, 1);
    expect(tests.hasTestPassed).to.equal(true);  
    winston.info({message: 'UNIT TEST: EVLRN_INVALID_INDEX ended'});
  })


  // 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  it("EVLRN_SHORT", async function () {
    winston.info({message: 'UNIT TEST:: BEGIN EVLRN_SHORT test'});
		RetrievedValues.setNodeNumber(1);
    mock_Cbus.learningNode = 1;
    await tests.test_EVLRN_SHORT(RetrievedValues, "01000200", 1, 1);
    expect(tests.hasTestPassed).to.equal(true);  
    winston.info({message: 'UNIT TEST: EVLRN_SHORT ended'});
  })


})

