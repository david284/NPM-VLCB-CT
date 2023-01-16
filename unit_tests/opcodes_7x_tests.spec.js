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




    function GetTestCase_RQNPN() {
		var arg1, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) arg1 = 0;
			if (a == 2) arg1 = 1;
			if (a == 3) arg1 = 7;
			testCases.push({'parameterIndex':arg1});
		}
		return testCases;
	}


    // 0x73 - RQNPN
    itParam("RQNPN test ${JSON.stringify(value)}", GetTestCase_RQNPN(), function (done, value) {
		winston.info({message: 'UNIT TEST:: BEGIN RQNPN test'});
		var retrieved_values = { "nodeNumber": 0, "nodeParameters": {}};
        var result = tests.test_RQNPN(value.parameterIndex, retrieved_values, test_module_descriptor);
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: RQNPN ended'});
            expect(tests.hasTestPassed).to.equal(true);
			done();
		}, test_timeout);
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
    itParam("MODE test ${JSON.stringify(value)}", GetTestCase_MODE(), function (done, value) {
		winston.info({message: 'UNIT TEST:: BEGIN MODE test'});
		var retrieved_values = { "nodeNumber": 0, "nodeParameters": {}};
        var result = tests.test_MODE(retrieved_values, test_module_descriptor, value.MODE);
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: MODE ended'});
            expect(tests.hasTestPassed).to.equal(true);
			done();
		}, test_timeout);
	})



    // 0x78 - RQSD
	it("RQSD test", function (done) {
		winston.info({message: 'UNIT TEST:: BEGIN RQSD test'});
		// storage for values retrieved from module under test	
		var retrieved_values = { "nodeNumber": 0 };
        var result = tests.test_RQSD(retrieved_values, 0);
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: RQSD ended'});
            winston.info({message: 'UNIT TEST: retrieved_values ' + JSON.stringify(retrieved_values, null, "    ")});
            expect(tests.hasTestPassed).to.equal(true);
			expect(Object.keys(retrieved_values.Services).length).to.equal(3);			// should be three services
			expect(retrieved_values.Services[0].ServiceType).to.equal(1);	// first service is type 1
			done();
		}, test_timeout);
	})



})