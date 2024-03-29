'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_7x = require('./../Test_cases/opcodes_7x.js');
const test_module_descriptor = require('./../unit_tests/module_descriptors/CANTEST_165_2_117.json');
const RetrievedValues = require('./../RetrievedValues.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

const NET_PORT = 5567;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_7x unit tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_7x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
    utils.DisplayUnitTestHeader('opcodes_7x unit tests');
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
      utils.DisplayUnitTestFooter('opcodes_7x unit tests finished');
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

  // Used where an opcode returns both a CMDERR and a GRSP on a fault
  //
  function GetTestCase_DoubleFaultCode() {
    var arg1, arg2, testCases = [];
    for (var a = 1; a<= 7; a++) {
      if (a == 1) {arg1 = 0, arg2 = true}
      if (a == 2) {arg1 = 1, arg2 = false}
      if (a == 3) {arg1 = 2, arg2 = false}
      if (a == 4) {arg1 = 3, arg2 = false}
      if (a == 5) {arg1 = 4, arg2 = false}
      if (a == 6) {arg1 = 5, arg2 = false}
      if (a == 7) {arg1 = 6, arg2 = false}
      testCases.push({ 'testOption':arg1, 'expectedResult':arg2 });
    }
    return testCases;
  }

  

	// directly set the mock node variables for the test, so we can reliably adjust the timeout for teh variable count
	// could add lots more but only adds to the time needed to wait for completion of test
	// NOTE: node variable count doesn't include variable [0] - so one less than length of array
	var nodeVariables = [ 5, 1, 2, 3, 4, 5 ];
	var nodeVariableCount = nodeVariables.length-1

  function GetTestCase_NVRD() {
		var arg1, arg2, arg3, testCases = [];
		for (var a = 1; a<= 4; a++) {
			if (a == 1) {arg1 = 0, arg3 = true}
			if (a == 2) {arg1 = 1, arg3 = true}
			if (a == 3) {arg1 = 65535, arg3 = true}
			if (a == 4) {arg1 = 2, arg3 = false}
			for (var b = 1; b < 4; b++) {
				if (b == 1) {arg2 = 0}
				if (b == 2) {arg2 = 1}
				if (b == 3) {arg2 = nodeVariableCount}
				testCases.push({'nodeNumber':arg1, 'nodeVariableIndex':arg2, 'expectedResult': arg3});
			}
		}
		return testCases;
	}

  // 0x71 - NVRD
  itParam("NVRD test ${JSON.stringify(value)}", GetTestCase_NVRD(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NVRD test ' + JSON.stringify(value)});
		mock_Cbus.modules[0].nodeVariables = nodeVariables;
		RetrievedValues.setNodeNumber(value.nodeNumber);
		RetrievedValues.data.Services[1] = {};
		RetrievedValues.data.nodeParameters = { "6":{ "value":nodeVariableCount } };	// set node variable count
    var result = await tests.test_NVRD(RetrievedValues, 1, value.nodeVariableIndex);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
    winston.info({message: 'UNIT TEST: NVRD ended'});
	})


  // 0x71 - NVRD
  itParam("NVRD_INVALID_INDEX test ${JSON.stringify(value)}", GetTestCase_DoubleFaultCode(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN NVRD_INVALID_INDEX test'});
		mock_Cbus.modules[0].nodeVariables = nodeVariables;
    mock_Cbus.testOption = value.testOption
		RetrievedValues.setNodeNumber(0);
		RetrievedValues.data.Services[1] = {};
		RetrievedValues.data.nodeParameters = { "6":{ "value":nodeVariableCount } };	// set node variable count
  	var result = await tests.test_NVRD_INVALID_INDEX(RetrievedValues, 1, nodeVariableCount + 1);		// request non-existant index
    winston.info({message: 'UNIT TEST: NVRD_INVALID_INDEX ended'});
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
	})


	// 0x71 - NVRD_SHORT
	it("NVRD_SHORT test", async function () {
		winston.info({message: 'UNIT TEST:: BEGIN NVRD_SHORT test'});
		mock_Cbus.modules[0].nodeVariables = nodeVariables;
		RetrievedValues.setNodeNumber(0);
		RetrievedValues.data.Services[1] = {};
		RetrievedValues.data.nodeParameters = { "6":{ "value":nodeVariableCount } };	// set node variable count
		var result = await tests.test_NVRD_SHORT(RetrievedValues, 1, nodeVariableCount + 1);		// request non-existant index
		winston.info({message: 'UNIT TEST: NVRD_SHORT ended'});
    expect(result).to.equal(true);
		expect(tests.hasTestPassed).to.equal(true);
	})
	
	
	function GetTestCase_RQNPN() {
		var arg1, arg2, arg3, testCases = [];
		for (var a = 1; a<= 4; a++) {
			if (a == 1) {arg1 = 0, arg3 = true}
			if (a == 2) {arg1 = 1, arg3 = true}
			if (a == 3) {arg1 = 65535, arg3 = true}
			if (a == 4) {arg1 = 2, arg3 = false}
			for (var b = 1; b < 4; b++) {
				if (b == 1) {arg2 = 0}
				if (b == 2) {arg2 = 1}
				if (b == 3) {arg2 = 20}
				testCases.push({'nodeNumber':arg1, 'parameterIndex':arg2, 'expectedResult':arg3});
			}
		}
		return testCases;
	}


  // 0x73 - RQNPN
  itParam("RQNPN test ${JSON.stringify(value)}", GetTestCase_RQNPN(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN RQNPN test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
  	var result = await tests.test_RQNPN(RetrievedValues, test_module_descriptor, value.parameterIndex);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END RQNPN test'});    
	})


  // 0x73 - RQNPN_INVALID_INDEX
  itParam("RQNPN_INVALID_INDEX test ${JSON.stringify(value)}", GetTestCase_DoubleFaultCode(), async function (value) {
//    it("RQNPN_INVALID_INDEX test", async function () {
		winston.info({message: 'UNIT TEST:: BEGIN RQNPN_INVALID_INDEX test'});
    mock_Cbus.testOption = value.testOption
		RetrievedValues.setNodeNumber(0);
  	var result = await tests.test_RQNPN_INVALID_INDEX(RetrievedValues, test_module_descriptor, 21);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END RQNPN_INVALID_INDEX test'});
	})


  // 0x73 - RQNPN_SHORT
  it("RQNPN_SHORT test", async function () {
		winston.info({message: 'UNIT TEST:: BEGIN RQNPN_SHORT test'});
		RetrievedValues.setNodeNumber(0);
  	var result = await tests.test_RQNPN_SHORT(RetrievedValues, test_module_descriptor, 21);
    expect(result).to.equal(true);
    expect(tests.hasTestPassed).to.equal(true);
		winston.info({message: 'UNIT TEST:: END RQNPN_SHORT test'});
	})


  function GetTestCase_CANID() {
		var arg1, arg2, arg3, testCases = [];
		for (var a = 1; a<= 4; a++) {
			if (a == 1) {arg1 = 0, arg3 = true}
			if (a == 2) {arg1 = 1, arg3 = true}
			if (a == 3) {arg1 = 65535, arg3 = true}
			if (a == 4) {arg1 = 2, arg3 = false}
			for (var b = 1; b < 3; b++) {
				if (b == 1) {arg2 = 1}
				if (b == 2) {arg2 = 99}
				testCases.push({'nodeNumber':arg1, 'CANID':arg2, 'expectedResult':arg3});
			}
		}
		return testCases;
	}


  // 0x75 - CANID
  itParam("CANID test ${JSON.stringify(value)}", GetTestCase_CANID(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN CANID test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
  	var result = await tests.test_CANID(RetrievedValues, value.CANID);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
		winston.info({message: 'UNIT TEST:: END CANID test'});    
	})


  function GetTestCase_CANID_INVALID_VALUE() {
		var arg1, arg2, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) {arg1 = 0}
			if (a == 2) {arg1 = 1}
			if (a == 3) {arg1 = 65535}
			for (var b = 1; b < 4; b++) {
				if (b == 1) {arg2 = 0}
				if (b == 2) {arg2 = 100}
				if (b == 3) {arg2 = 255}
				testCases.push({'nodeNumber':arg1, 'CANID':arg2});
			}
		}
		return testCases;
	}


  // 0x75 - CANID_INVALID_VALUE
  itParam("CANID_INVALID_VALUE test ${JSON.stringify(value)}", GetTestCase_CANID_INVALID_VALUE(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN CANID_INVALID_VALUE test'});
		RetrievedValues.setNodeNumber(value.nodeNumber);
  	var result = await tests.test_CANID_INVALID_VALUE(RetrievedValues, value.CANID);
    expect(result).to.equal(true);
    expect(tests.hasTestPassed).to.equal(true);
		winston.info({message: 'UNIT TEST:: END CANID_INVALID_VALUE test'});    
	})


  // 0x75 - CANID_SHORT
  it("CANID_SHORT test", async function () {
		winston.info({message: 'UNIT TEST:: BEGIN CANID_SHORT test'});
		RetrievedValues.setNodeNumber(0);
  	var result = await tests.test_CANID_SHORT(RetrievedValues, 21);
    expect(result).to.equal(true);
    expect(tests.hasTestPassed).to.equal(true);
		winston.info({message: 'UNIT TEST:: END CANID_SHORT test'});
	})


  function GetTestCase_MODE() {
		var arg1, arg2, arg3, testCases = [];
		for (var a = 1; a<= 4; a++) {
			if (a == 1) {arg1 = 0, arg3 = true}
			if (a == 2) {arg1 = 1, arg3 = true}
			if (a == 3) {arg1 = 65535, arg3 = true}
			if (a == 4) {arg1 = 2, arg3 = false}
			for (var b = 1; b < 4; b++) {
				if (b == 1) {arg2 = 0}
				if (b == 2) {arg2 = 1}
				if (b == 3) {arg2 = 2}
				testCases.push({'nodeNumber':arg1, 'MODE':arg2, 'expectedResult':arg3 });
			}
		}
		return testCases;
	}


	// 0x76 - MODE
	itParam("MODE test ${JSON.stringify(value)}", GetTestCase_MODE(), async function (value) {
		winston.info({message: 'UNIT TEST: BEGIN MODE test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
    var result = await tests.test_MODE(RetrievedValues, test_module_descriptor, value.MODE);
    winston.info({message: 'UNIT TEST: MODE ended'});
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
	})



  function GetTestCase_RQSD() {
		var arg1, arg2, arg3, testCases = [];
		for (var a = 1; a<= 4; a++) {
			if (a == 1) {arg1 = 0, arg3 = true}
			if (a == 2) {arg1 = 1, arg3 = true}
			if (a == 3) {arg1 = 65535, arg3 = true}
			if (a == 4) {arg1 = 2, arg3 = false}
			for (var b = 1; b < 4; b++) {
				if (b == 1) {arg2 = 0}
				if (b == 2) {arg2 = 1}
				if (b == 3) {arg2 = 2}
				testCases.push({ 'nodeNumber':arg1, 'ServiceIndex':arg2, 'expectedResult':arg3 });
			}
		}
		return testCases;
	}
	

  // 0x78 - RQSD
  itParam("RQSD test ${JSON.stringify(value)}", GetTestCase_RQSD(), async function (value) {
		winston.info({message: 'UNIT TEST:: BEGIN RQSD test ' + JSON.stringify(value)});
		RetrievedValues.setNodeNumber(value.nodeNumber);
    var result = await tests.test_RQSD(RetrievedValues, value.ServiceIndex);
    expect(result).to.equal(value.expectedResult);
    expect(tests.hasTestPassed).to.equal(value.expectedResult);
    winston.info({message: 'UNIT TEST: RQSD ended'});
	})


  // 0x78 - RQSD_INVALID_SERVICE
  it("RQSD_INVALID_SERVICE test",  async function () {
		winston.info({message: 'UNIT TEST:: BEGIN RQSD_INVALID_SERVICE test'});
		RetrievedValues.setNodeNumber(0);
    var result = await tests.test_RQSD_INVALID_SERVICE(RetrievedValues, 4);
    expect(result).to.equal(true);
    expect(tests.hasTestPassed).to.equal(true);
    winston.info({message: 'UNIT TEST: RQSD_INVALID_SERVICE ended'});
	})

  // 0x78 - RQSD_SHORT
  it("RQSD_SHORT test",  async function () {
		winston.info({message: 'UNIT TEST:: BEGIN RQSD_SHORT test'});
		RetrievedValues.setNodeNumber(0);
    var result = await tests.test_RQSD_SHORT(RetrievedValues, 1);
    expect(result).to.equal(true);
    expect(tests.hasTestPassed).to.equal(true);
    winston.info({message: 'UNIT TEST: RQSD_SHORT ended'});
	})




})