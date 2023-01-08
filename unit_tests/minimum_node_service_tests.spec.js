'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const test_module_descriptor = require('./../unit_tests/module_descriptors/CANTEST_165_2_117.json');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const MNS_tests = require('./../MinimumNodeServiceTests.js');


// Assert style
var assert = require('chai').assert;

const NET_PORT = 5556;
const NET_ADDRESS = "127.0.0.1"



describe('Minimum Node Service tests', function(){
	let mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	let Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	let mns_tests = new MNS_tests.MinimumNodeServiceTests(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    let test_timeout = mns_tests.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		winston.info({message: '======================================================================'});
		winston.info({message: '----------------------- Minimum Node Service unit tests -------------------'});
		winston.info({message: '======================================================================'});
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
// 				Testing Minimum Node Services (MNS) 
//


    
	it("QNN test", function (done) {
		winston.info({message: 'UNIT TEST: BEGIN QNN test'});
        var result = mns_tests.test_QNN(0);
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: QNN ended'});
            expect(mns_tests.hasTestPassed).to.equal(true);
			done();
		}, test_timeout);
	})

    
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


    //
    itParam("RQNPN test parameterIndex ${value.parameterIndex}", GetTestCase_RQNPN(), function (done, value) {
		winston.info({message: 'UNIT TEST:: BEGIN RQNPN test'});
		var retrieved_values = {"nodeParameters": {}};
        var result = mns_tests.test_RQNPN(0, value.parameterIndex, retrieved_values, test_module_descriptor);
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: RQNPN ended'});
            expect(mns_tests.hasTestPassed).to.equal(true);
			done();
		}, test_timeout);
	})


    function GetTestCase_RQSD() {
		var arg1, testCases = [];
		for (var a = 1; a< 2; a++) {
			if (a == 1) arg1 = 0;
			testCases.push({'ServiceIndex':arg1});
		}
		return testCases;
	}


    //
    itParam("RQSD test ServiceIndex ${value.ServiceIndex}", GetTestCase_RQSD(), function (done, value) {
		winston.info({message: 'UNIT TEST:: BEGIN RQSD test'});
        var result = mns_tests.test_RQSD(0, value.ServiceIndex);
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: RQSD ended'});
            expect(mns_tests.hasTestPassed).to.equal(true);
			done();
		}, test_timeout);
	})


})