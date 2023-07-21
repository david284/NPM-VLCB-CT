'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_7x = require('./../opcodes/opcodes_7x.js');
const test_module_descriptor = require('./../unit_tests/module_descriptors/CANTEST_165_2_117.json');
const RetrievedValues = require('./../RetrievedValues.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


// Assert style
const assert = require('chai').assert;

const NET_PORT = 5567;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_7x tests', function(){
	const mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	const Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_7x.opcodes_7x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------------ opcodes_7x unit tests -------------------'});
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
            winston.info({message: 'UNIT TEST: tests finished '});
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


	// directly set the mock node variables for the test, so we can reliably adjust the timeout for teh variable count
	// could add lots more but only adds to the time needed to wait for completion of test
	// NOTE: node variable count doesn't include variable [0] - so one less than length of array
	var nodeVariables = [ 5, 1, 2, 3, 4, 5 ];
	var nodeVariableCount = nodeVariables.length-1

    function GetTestCase_NVRD() {
		var arg1, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) {arg1 = 0}
			if (a == 2) {arg1 = 1}
			if (a == 3) {arg1 = nodeVariableCount}
			testCases.push({'nodeVariableIndex':arg1});
		}
		return testCases;
	}


    // 0x71 - NVRD
    itParam("NVRD test ${JSON.stringify(value)}", GetTestCase_NVRD(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NVRD test'});
		mock_Cbus.modules[0].nodeVariables = nodeVariables;
		RetrievedValues.setNodeNumber(0);
		RetrievedValues.data.Services[1] = {};
		RetrievedValues.data.nodeParameters = { "6":{ "value":nodeVariableCount } };	// set node variable count
    await tests.test_NVRD(RetrievedValues, 1, value.nodeVariableIndex);
		winston.debug({message: 'UNIT TEST: RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, '    ')});        
    expect(tests.hasTestPassed).to.equal(true);
    winston.info({message: 'UNIT TEST: NVRD ended'});
	})


    // 0x71 - NVRD_ERROR
	it("NVRD_ERROR test", async function () {
		winston.info({message: 'UNIT TEST:: BEGIN NVRD_ERROR test'});
		mock_Cbus.modules[0].nodeVariables = nodeVariables;
		RetrievedValues.setNodeNumber(0);
		RetrievedValues.data.Services[1] = {};
		RetrievedValues.data.nodeParameters = { "6":{ "value":nodeVariableCount } };	// set node variable count
  	await tests.test_NVRD_ERROR(RetrievedValues, 1, nodeVariableCount + 1);		// request non-existant index
    winston.info({message: 'UNIT TEST: NVRD_ERROR ended'});
    expect(tests.hasTestPassed).to.equal(true);
	})


    // 0x71 - NVRD_SHORT
		it("NVRD_SHORT test", async function () {
			winston.info({message: 'UNIT TEST:: BEGIN NVRD_SHORT test'});
			mock_Cbus.modules[0].nodeVariables = nodeVariables;
			RetrievedValues.setNodeNumber(0);
			RetrievedValues.data.Services[1] = {};
			RetrievedValues.data.nodeParameters = { "6":{ "value":nodeVariableCount } };	// set node variable count
			await tests.test_NVRD_SHORT(RetrievedValues, 1, nodeVariableCount + 1);		// request non-existant index
			winston.info({message: 'UNIT TEST: NVRD_SHORT ended'});
			expect(tests.hasTestPassed).to.equal(true);
		})
	
	
			function GetTestCase_RQNPN() {
		var arg1, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) arg1 = 0;
			if (a == 2) arg1 = 1;
			if (a == 3) arg1 = 20;
			testCases.push({'parameterIndex':arg1});
		}
		return testCases;
	}


  // 0x73 - RQNPN
  itParam("RQNPN test ${JSON.stringify(value)}", GetTestCase_RQNPN(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN RQNPN test'});
		RetrievedValues.setNodeNumber(0);
  	await tests.test_RQNPN(RetrievedValues, test_module_descriptor, value.parameterIndex);
    winston.info({message: 'UNIT TEST: RQNPN ended'});
    expect(tests.hasTestPassed).to.equal(true);
		winston.info({message: 'UNIT TEST: RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, '    ')});        
	})



  function GetTestCase_MODE() {
		var arg1, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) arg1 = 0;
			if (a == 2) arg1 = 1;
			if (a == 3) arg1 = 2;
			testCases.push({'MODE':arg1});
		}
		return testCases;
	}


	// 0x76 - MODE
	itParam("MODE test ${JSON.stringify(value)}", GetTestCase_MODE(), async function (value) {
		winston.info({message: 'UNIT TEST: BEGIN MODE test'});
		RetrievedValues.setNodeNumber(0);
    await tests.test_MODE(RetrievedValues, test_module_descriptor, value.MODE);
    winston.info({message: 'UNIT TEST: MODE ended'});
    expect(tests.hasTestPassed).to.equal(true);
	})



    function GetTestCase_RQSD() {
		var arg1, testCases = [];
		for (var a = 1; a< 5; a++) {
			if (a == 1) arg1 = 0;
			if (a == 2) arg1 = 1;
			if (a == 3) arg1 = 2;
			if (a == 4) arg1 = 3;
			testCases.push({'ServiceIndex':arg1});
		}
		return testCases;
	}
	
	const Services = {
		"1": {
			"ServiceIndex": 3, "ServiceType": 1, "ServiceVersion": 0,
			"diagnostics": { "1": {"DiagnosticCode": 1, "DiagnosticValue": 1} }
		},
		"2": {
			"ServiceIndex": 4, "ServiceType": 2, "ServiceVersion": 0,
			"diagnostics": { "1": {"DiagnosticCode": 1, "DiagnosticValue": 1} }
		},
		"3": {
			"ServiceIndex": 5, "ServiceType": 3, "ServiceVersion": 0,
			"diagnostics": { "1": {"DiagnosticCode": 1, "DiagnosticValue": 1} }
		},
		"4": {
			"ServiceIndex": 6, "ServiceType": 2, "ServiceVersion": 0,
			"diagnostics": { "1": {"DiagnosticCode": 1, "DiagnosticValue": 1} }
		}
	}



  // 0x78 - RQSD
  itParam("RQSD test ${JSON.stringify(value)}", GetTestCase_RQSD(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN RQSD test'});
		mock_Cbus.Services = Services;
		// storage for values retrieved from module under test	
		RetrievedValues.setNodeNumber(0);
    await tests.test_RQSD(RetrievedValues, value.ServiceIndex);
    winston.info({message: 'UNIT TEST: RQSD ended'});
    winston.info({message: 'UNIT TEST: retrieved_values ' + JSON.stringify(RetrievedValues.data, null, "    ")});
    expect(tests.hasTestPassed).to.equal(true);
//			expect(Object.keys(retrieved_values.Services).length).to.equal(3);			// should be three services
//			expect(retrieved_values.Services[0].ServiceType).to.equal(1);	// first service is type 1
	})



})