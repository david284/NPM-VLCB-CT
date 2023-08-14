'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const test_module_descriptor = require('./../unit_tests/module_descriptors/CANTEST_165_2_117.json');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const RetrievedValues = require('./../RetrievedValues.js');
const NVS_tests = require('./../Services/Type2_NodeVariableService.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

const NET_PORT = 5557;				// 5555 + service type offset
const NET_ADDRESS = "127.0.0.1"


describe('Node variable Service unit tests', function(){
	const mock_Cbus = new Mock_Cbus(NET_PORT);
	const Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new NVS_tests.NodeVariableServiceTests(Network);

    const test_timeout = 100;

	before(function() {
    utils.DisplayUnitTestHeader('Node variable Service unit tests');
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
      utils.DisplayUnitTestFooter('Node variable Service unit tests finished');
      setTimeout(function(){
        // timeout to allow the finish text above to print
        done();
      }, 100);
		}, 100);
  });


///////////////////////////////////////////////////////////////////////////////
//
// 				Testing Minimum Node Services (MNS) 
//

  // 
	it("Node Variable Count test - pass", function (done) {
		winston.info({message: 'UNIT TEST:: BEGIN Node Variable Count test'});
		// setup data	
		RetrievedValues.data.nodeParameters = {"6": { "value": 2 } };
		RetrievedValues.data.nodeVariables = {"1": 1, "2":2 };
		RetrievedValues.data.TestsPassed = 0;
		RetrievedValues.data.TestsFailed = 0;
		// now run test
    var result = tests.test_NodeVariableCount(RetrievedValues, 1);
		setTimeout(function(){
      winston.info({message: 'UNIT TEST: Node Variable Count ended'});
			winston.debug({message: 'UNIT TEST: RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, '    ')});
      expect(tests.hasTestPassed).to.equal(true);
      expect(RetrievedValues.data.TestsPassed).to.equal(1);
      expect(RetrievedValues.data.TestsFailed).to.equal(0);
			done();
		}, test_timeout);
	})

  // 
	it("Node Variable Count test - fail", function (done) {
		winston.info({message: 'UNIT TEST:: BEGIN Node Variable Count test'});
		// setup data	
		RetrievedValues.data.nodeParameters = {"6": { "value": 3 } };
		RetrievedValues.data.nodeVariables = {"1": 1, "2":2 };
		RetrievedValues.data.TestsPassed = 0;
		RetrievedValues.data.TestsFailed = 0;
		// now run test
    var result = tests.test_NodeVariableCount(RetrievedValues, 1);
		setTimeout(function(){
      winston.info({message: 'UNIT TEST: Node Variable Count ended'});
			winston.debug({message: 'UNIT TEST: RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, '    ')});
      expect(tests.hasTestPassed).to.equal(false);
      expect(RetrievedValues.data.TestsPassed).to.equal(0);
      expect(RetrievedValues.data.TestsFailed).to.equal(1);
			done();
		}, test_timeout);
	})

})