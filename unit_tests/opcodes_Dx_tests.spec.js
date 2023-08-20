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
const utils = require('./../utilities.js');
const assert = require('chai').assert;

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

const NET_PORT = 5573;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"

describe('opcodes_Dx unit tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_Dx(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
    utils.DisplayUnitTestHeader('opcodes_Dx unit tests');
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
      utils.DisplayUnitTestFooter('opcodes_Dx unit tests finished');
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
    var arg1, arg2, arg3, arg4, arg5, testCases = [];
    for (var a = 1; a<= 4; a++) {
      if (a == 1) {arg1 = 0, arg5 = true}
      if (a == 2) {arg1 = 1, arg5 = true}
      if (a == 3) {arg1 = 65535, arg5 = true}
      if (a == 4) {arg1 = 2, arg5 = false}
      for (var b = 1; b< 5; b++) {
        if (b == 1) {arg2 = "00000000"}
        if (b == 2) {arg2 = "00000001"}
        if (b == 3) {arg2 = "00010000"}
        if (b == 4) {arg2 = "FFFFFFFF"}
        for (var c = 1; c < 4; c++) {
          if (c == 1) {arg3 = 0}
          if (c == 2) {arg3 = 1}
          if (c == 3) {arg3 = 254}    // note 255 is used for Invalid Event Variable Index test
          for (var d = 1; d < 4; d++) {
            if (d == 1) {arg4 = 0}
            if (d == 2) {arg4 = 1}
            if (d == 3) {arg4 = 255}
            testCases.push({'nodeNumber':arg1,
              'eventIdentifier':arg2,
              'eventVariableIndex': arg3,
              'eventVariableValue': arg4,
              'expectedResult':arg5 });
          }
        }
      }
    }
    return testCases;
  }


  // 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  itParam("EVLRN test ${JSON.stringify(value)}", GetTestCase_EVLRN(), async function (value) {
    winston.info({message: 'UNIT TEST:: BEGIN EVLRN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
    if (value.expectedResult == true) { 
      mock_Cbus.learningNode = value.nodeNumber 
    } else {
      mock_Cbus.learningNode = null
    }
    var result = await tests.test_EVLRN(RetrievedValues, value.eventIdentifier, value.eventVariableIndex, value.eventVariableValue);
    expect(result).to.equal(value.expectedResult);  
    expect(tests.hasTestPassed).to.equal(value.expectedResult);  
    winston.info({message: 'UNIT TEST: EVLRN ended'});
  })
    

  // 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  it("EVLRN_INVALID_EVENT", async function () {
    winston.info({message: 'UNIT TEST:: BEGIN EVLRN_INVALID_EVENT test'});
		RetrievedValues.setNodeNumber(1);
    mock_Cbus.learningNode = 1;
    mock_Cbus.eventLimitReached = true;   // set to ensure error condition is met
    var result = await tests.test_EVLRN_INVALID_EVENT(RetrievedValues, "FFF00000", 1, 1);
    expect(result).to.equal(true);  
    expect(tests.hasTestPassed).to.equal(true);  
    winston.info({message: 'UNIT TEST: EVLRN_INVALID_EVENT ended'});
  })




  // 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  it("EVLRN_INVALID_INDEX", async function () {
    winston.info({message: 'UNIT TEST:: BEGIN EVLRN_INVALID_INDEX test'});
		RetrievedValues.setNodeNumber(1);
    mock_Cbus.learningNode = 1;
    var result = await tests.test_EVLRN_INVALID_INDEX(RetrievedValues, "01000200", 255, 1);
    expect(result).to.equal(true);  
    expect(tests.hasTestPassed).to.equal(true);  
    winston.info({message: 'UNIT TEST: EVLRN_INVALID_INDEX ended'});
  })


  // 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  it("EVLRN_SHORT", async function () {
    winston.info({message: 'UNIT TEST:: BEGIN EVLRN_SHORT test'});
		RetrievedValues.setNodeNumber(1);
    mock_Cbus.learningNode = 1;
    var result = await tests.test_EVLRN_SHORT(RetrievedValues, "01000200", 1, 1);
    expect(result).to.equal(true);  
    expect(tests.hasTestPassed).to.equal(true);  
    winston.info({message: 'UNIT TEST: EVLRN_SHORT ended'});
  })


})

