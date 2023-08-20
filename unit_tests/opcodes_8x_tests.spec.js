'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_8x = require('./../opcodes/opcodes_8x.js');
const RetrievedValues = require('./../RetrievedValues.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

const NET_PORT = 5568;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_8x unit tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_8x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
    utils.DisplayUnitTestHeader('opcodes_8x unit tests');
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
      utils.DisplayUnitTestFooter('opcodes_8x unit tests finished');
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


    // 0x87 - RDGN
    itParam("RDGN test ${JSON.stringify(value)}", GetTestCase_NodeNumber(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN RDGN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber( value.nodeNumber );
		// storage for values retrieved from module under test	
		RetrievedValues.addService(1,1,1); // 	"1": { "ServiceIndex": 1, "ServiceType": 1, "ServiceVersion": "1" }, 
		RetrievedValues.addService(2,1,1); //		"2": { "ServiceIndex": 2, "ServiceType": 1, "ServiceVersion": 1 },  
		RetrievedValues.addService(3,2,1); //		"3": { "ServiceIndex": 3, "ServiceType": 2, "ServiceVersion": "1" },  
		RetrievedValues.addService(4,1,2); // 	"4": { "ServiceIndex": 4, "ServiceType": 1, "ServiceVersion": 2 } } 
		// ok, all setup, now start test - service 0, diagnostics 0
    var result = await tests.test_RDGN(RetrievedValues, 0, 0);
		winston.info({message: 'UNIT TEST: RDGN ended'});
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
	})


  // 0x87 - RDGN
  it("RDGN_INVALID_DIAG test", async function () {
    winston.info({message: 'UNIT TEST:: BEGIN RDGN_INVALID_DIAG test'});
    RetrievedValues.setNodeNumber(0);
    // storage for values retrieved from module under test	
    RetrievedValues.addService(1,1,1); // 	"1": { "ServiceIndex": 1, "ServiceType": 1, "ServiceVersion": "1" }, 
    RetrievedValues.addService(2,1,1); //		"2": { "ServiceIndex": 2, "ServiceType": 1, "ServiceVersion": 1 },  
    RetrievedValues.addService(3,2,1); //		"3": { "ServiceIndex": 3, "ServiceType": 2, "ServiceVersion": "1" },  
    RetrievedValues.addService(4,1,2); // 	"4": { "ServiceIndex": 4, "ServiceType": 1, "ServiceVersion": 2 } } 
    // ok, all setup, now start test - service 1, diagnostics 99
    var result = await tests.test_RDGN_INVALID_DIAG(RetrievedValues, 1, 99);
    expect(result).to.equal(true);
    expect(tests.hasTestPassed).to.equal(true);
    winston.info({message: 'UNIT TEST: RDGN_INVALID_DIAG ended'});
  })

  
  // 0x87 - RDGN
  it("RDGN_INVALID_SERVICE test", async function () {
    winston.info({message: 'UNIT TEST:: BEGIN RDGN_INVALID_SERVICE test'});
    RetrievedValues.setNodeNumber(0);
    // storage for values retrieved from module under test	
    RetrievedValues.addService(1,1,1); // 	"1": { "ServiceIndex": 1, "ServiceType": 1, "ServiceVersion": "1" }, 
    RetrievedValues.addService(2,1,1); //		"2": { "ServiceIndex": 2, "ServiceType": 1, "ServiceVersion": 1 },  
    RetrievedValues.addService(3,2,1); //		"3": { "ServiceIndex": 3, "ServiceType": 2, "ServiceVersion": "1" },  
    RetrievedValues.addService(4,1,2); // 	"4": { "ServiceIndex": 4, "ServiceType": 1, "ServiceVersion": 2 } } 
    // ok, all setup, now start test - service 5, diagnostics 0
    var result = await tests.test_RDGN_INVALID_SERVICE(RetrievedValues, 5, 0);
    expect(result).to.equal(true);
    expect(tests.hasTestPassed).to.equal(true);
    winston.info({message: 'UNIT TEST: RDGN_INVALID_SERVICE ended'});
  })

  
  // 0x87 - RDGN
  it("RDGN_SHORT", async function () {
    winston.info({message: 'UNIT TEST:: BEGIN RDGN_SHORT test'});
    RetrievedValues.setNodeNumber(0);
    // storage for values retrieved from module under test	
    RetrievedValues.addService(1,1,1); // 	"1": { "ServiceIndex": 1, "ServiceType": 1, "ServiceVersion": "1" }, 
    RetrievedValues.addService(2,1,1); //		"2": { "ServiceIndex": 2, "ServiceType": 1, "ServiceVersion": 1 },  
    RetrievedValues.addService(3,2,1); //		"3": { "ServiceIndex": 3, "ServiceType": 2, "ServiceVersion": "1" },  
    RetrievedValues.addService(4,1,2); // 	"4": { "ServiceIndex": 4, "ServiceType": 1, "ServiceVersion": 2 } } 
    // ok, all setup, now start test - service 5, diagnostics 0
    var result = await tests.test_RDGN_SHORT(RetrievedValues, 5, 0);
    expect(result).to.equal(true);
    expect(tests.hasTestPassed).to.equal(true);
    winston.info({message: 'UNIT TEST: RDGN_SHORT ended'});
  })

  function GetTestCase_NVSETRD() {
    var arg1, arg2, arg3, arg4, testCases = [];
    for (var a = 1; a<= 4; a++) {
      if (a == 1) {arg1 = 0, arg4 = true}
      if (a == 2) {arg1 = 1, arg4 = true}
      if (a == 3) {arg1 = 65535, arg4 = true}
      if (a == 4) {arg1 = 2, arg4 = false}
        for (var b = 1; b < 4; b++) {
        if (b == 1) {arg2 = 1}
        if (b == 2) {arg2 = 2}
        if (b == 3) {arg2 = 3}
        for (var c = 1; c < 4; c++) {
          if (c == 1) {arg3 = 0}
          if (c == 2) {arg3 = 1}
          if (c == 3) {arg3 = 255}
          testCases.push({'nodeNumber':arg1, 'nodeVariableIndex':arg2, 'nodeVariableValue': arg3, 'expectedResult':arg4 });
        }
      }
    }
    return testCases;
  }
  
  
    // 0x8E - NVSETRD
    // Format: [<MjPri><MinPri=3><CANID>]<8E><NN hi><NN lo><NV# ><NV val>
    itParam("NVSETRD test ${JSON.stringify(value)}", GetTestCase_NVSETRD(), async function (value) {
      winston.info({message: 'UNIT TEST:: BEGIN NVSETRD test ' + JSON.stringify(value)});
      RetrievedValues.setNodeNumber(value.nodeNumber);
      var result = await tests.test_NVSETRD(RetrievedValues, value.nodeVariableIndex, value.nodeVariableValue);
      expect(result).to.equal(true);  
      expect(tests.hasTestPassed).to.equal(true);  
      winston.info({message: 'UNIT TEST: NVSETRD ended'});
    })
  
    // 0x8E - NVSETRD
      // Format: [<MjPri><MinPri=3><CANID>]<8E><NN hi><NN lo><NV# ><NV val>
      it("NVSETRD_INVALID_INDEX", async function () {
      winston.info({message: 'UNIT TEST:: BEGIN NVSETRD_INVALID_INDEX test'});
      RetrievedValues.setNodeNumber(0);
      var result = await tests.test_NVSETRD_INVALID_INDEX(RetrievedValues, 255, 0);
      expect(result).to.equal(true);  
      expect(tests.hasTestPassed).to.equal(true);  
      winston.info({message: 'UNIT TEST: NVSETRD_INVALID_INDEX ended'});
    })

    // 0x8E - NVSETRD
    // Format: [<MjPri><MinPri=3><CANID>]<8E><NN hi><NN lo><NV# ><NV val>
    it("NVSETRD_SHORT", async function () {
      winston.info({message: 'UNIT TEST:: BEGIN NVSETRD_SHORT test'});
      RetrievedValues.setNodeNumber(0);
      await tests.test_NVSETRD_SHORT(RetrievedValues, 1, 0);
      expect(tests.hasTestPassed).to.equal(true);  

      winston.info({message: 'UNIT TEST: NVSETRD_SHORT ended'});
    })
  
})

