'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const test_module_descriptor = require('./../unit_tests/module_descriptors/CANTEST_165_2_117.json');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const SetupMode_tests = require('./../Tests_SetupMode.js');


// Assert style
var assert = require('chai').assert;

const NET_PORT = 5555;
const NET_ADDRESS = "127.0.0.1"



describe('Setup Mode tests', function(){
	let mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	let  Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	const SetupMode = new SetupMode_tests.SetupMode_tests(Network);


    // SetupMode have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    let test_timeout = SetupMode.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------------ Setup Mode unit tests -------------------'});
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
// 				Testing Minimum Node Services (MNS) 
//

	

    function GetTestCase_RQNN() {
		var arg1, testCases = [];
		for (var a = 1; a< 4; a++) {
			if (a == 1) arg1 = 0;
			if (a == 2) arg1 = 1;
			if (a == 3) arg1 = 65535;
			testCases.push({'nodeNumber':arg1});
		}
		return testCases;
	}


    // 0x50 RQNN
    itParam("RQNN test nodeNumber ${value.nodeNumber}", GetTestCase_RQNN(), function (done, value) {
		winston.info({message: 'UNIT TEST: BEGIN RQNN test'});
        mock_Cbus.enterSetup(value.nodeNumber);
		var retrieved_values = {};
		setTimeout(function(){
			SetupMode.checkForRQNN(retrieved_values);
            expect(SetupMode.inSetupMode).to.equal(true);
            expect(SetupMode.test_nodeNumber).to.equal(value.nodeNumber);
            winston.info({message: 'UNIT TEST: RQNN ended'});
            mock_Cbus.exitSetup(value.nodeNumber);
			done();
		}, test_timeout);
	})


    //
	it("RQNP test", function (done) {
		winston.info({message: 'UNIT TEST: BEGIN RQNP test'});
		var retrieved_values = {};
        mock_Cbus.enterSetup(0);
        var result = SetupMode.test_RQNP(retrieved_values);
		setTimeout(function(){
            expect(SetupMode.hasTestPassed).to.equal(true);
            winston.info({message: 'UNIT TEST: RQNP ended'});
            mock_Cbus.exitSetup(0);
			done();
		}, test_timeout);
	})


    //
	it("RQMN test", function (done) {
		winston.info({message: 'UNIT TEST: BEGIN RQMN test'});
		var retrieved_values = {};
        var result = SetupMode.test_RQMN(retrieved_values);
		setTimeout(function(){
            expect(SetupMode.hasTestPassed).to.equal(true);
            winston.info({message: 'UNIT TEST: RQMN ended'});
			done();
		}, test_timeout);
	})


    //
	it("SNN test", function (done) {
		winston.info({message: 'UNIT TEST: BEGIN SNN test'});
        var result = SetupMode.test_SNN();
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: SNN ended'});
            expect(SetupMode.hasTestPassed).to.equal(true);
			done();
		}, test_timeout);
	})

    

})