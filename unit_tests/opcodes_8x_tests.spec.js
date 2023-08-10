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



// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


// Assert style
const assert = require('chai').assert;

const NET_PORT = 5568;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_8x tests', function(){
	const mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	const Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_8x.opcodes_8x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------------ opcodes_8x unit tests -------------------'});
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
      winston.info({message: '-------------- opcodes_8x unit tests finished --------------'});
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


	// 0x87
	//
	// what we want to test
	// Service index	Service type	Service Version		Diagnostic Code
	//			1								1							1									1				//
	//			1								1							1									2				// change of code
	//			2								1							1									1				// change of index - same type
	//			3								2							1									1				// change of index, change of type
	//			4								1							2									1				// change of index, change of version

	// values to output from mockCbus - ServiceIndex, DiagnosticCode, DiagnosticValue
	var DGN_Outputs = {
				"1": { "ServiceIndex": 1, "DiagnosticCode": 1, "DiagnosticValue": 1 }, 
				"2": { "ServiceIndex": 1, "DiagnosticCode": 2, "DiagnosticValue": 2 },  
				"3": { "ServiceIndex": 2, "DiagnosticCode": 1, "DiagnosticValue": 3 },  
				"4": { "ServiceIndex": 3, "DiagnosticCode": 1, "DiagnosticValue": 4 }, 
				"5": { "ServiceIndex": 4, "DiagnosticCode": 1, "DiagnosticValue": 5 }
				};


    // 0x87 - RDGN
	it("RDGN test", async function () {
		winston.info({message: 'UNIT TEST:: BEGIN RDGN test'});
		RetrievedValues.setNodeNumber(0);
		// storage for values retrieved from module under test	
		RetrievedValues.addService(1,1,1); // 	"1": { "ServiceIndex": 1, "ServiceType": 1, "ServiceVersion": "1" }, 
		RetrievedValues.addService(2,1,1); //		"2": { "ServiceIndex": 2, "ServiceType": 1, "ServiceVersion": 1 },  
		RetrievedValues.addService(3,2,1); //		"3": { "ServiceIndex": 3, "ServiceType": 2, "ServiceVersion": "1" },  
		RetrievedValues.addService(4,1,2); // 	"4": { "ServiceIndex": 4, "ServiceType": 1, "ServiceVersion": 2 } } 
		// set mock CBUS with diagnostic values to be sent in response to query
		mock_Cbus.DGN_Outputs = DGN_Outputs;
		// ok, all setup, now start test - service 0, diagnostics 0
    await tests.test_RDGN(RetrievedValues, 0, 0);
		winston.info({message: 'UNIT TEST: RDGN ended'});
		expect(tests.hasTestPassed).to.equal(true);
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
    // set mock CBUS with diagnostic values to be sent in response to query
    mock_Cbus.DGN_Outputs = DGN_Outputs;
    // ok, all setup, now start test - service 1, diagnostics 99
    await tests.test_RDGN_INVALID_DIAG(RetrievedValues, 1, 99);
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
    // set mock CBUS with diagnostic values to be sent in response to query
    mock_Cbus.DGN_Outputs = DGN_Outputs;
    // ok, all setup, now start test - service 5, diagnostics 0
    await tests.test_RDGN_INVALID_SERVICE(RetrievedValues, 5, 0);
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
    // set mock CBUS with diagnostic values to be sent in response to query
    mock_Cbus.DGN_Outputs = DGN_Outputs;
    // ok, all setup, now start test - service 5, diagnostics 0
    await tests.test_RDGN_SHORT(RetrievedValues, 5, 0);
    expect(tests.hasTestPassed).to.equal(true);
    winston.info({message: 'UNIT TEST: RDGN_SHORT ended'});
  })

  function GetTestCase_NVSETRD() {
    var arg1, arg2, arg3, testCases = [];
    for (var a = 1; a< 4; a++) {
      if (a == 1) {arg1 = 0}
      if (a == 2) {arg1 = 1}
      if (a == 3) {arg1 = 65535}
      for (var b = 1; b < 4; b++) {
        if (b == 1) {arg2 = 1}
        if (b == 2) {arg2 = 2}
        if (b == 3) {arg2 = 3}
        for (var c = 1; c < 4; c++) {
          if (c == 1) {arg3 = 0}
          if (c == 2) {arg3 = 1}
          if (c == 3) {arg3 = 255}
          testCases.push({'nodeNumber':arg1, 'nodeVariableIndex':arg2, 'nodeVariableValue': arg3});
        }
      }
    }
    return testCases;
  }
  
  
      // 0x8E - NVSETRD
      // Format: [<MjPri><MinPri=3><CANID>]<8E><NN hi><NN lo><NV# ><NV val>
      itParam("NVSETRD test ${JSON.stringify(value)}", GetTestCase_NVSETRD(), async function (value) {
        winston.info({message: 'UNIT TEST:: BEGIN NVSETRD test'});
        RetrievedValues.setNodeNumber(value.nodeNumber);
        await tests.test_NVSETRD(RetrievedValues, value.nodeVariableIndex, value.nodeVariableValue);
        expect(tests.hasTestPassed).to.equal(true);  
  
        winston.info({message: 'UNIT TEST: NVSETRD ended'});
      })
  
    // 0x8E - NVSETRD
      // Format: [<MjPri><MinPri=3><CANID>]<8E><NN hi><NN lo><NV# ><NV val>
      it("NVSETRD_INVALID_INDEX", async function () {
      winston.info({message: 'UNIT TEST:: BEGIN NVSETRD_INVALID_INDEX test'});
      RetrievedValues.setNodeNumber(0);
      await tests.test_NVSETRD_INVALID_INDEX(RetrievedValues, 255, 0);
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

