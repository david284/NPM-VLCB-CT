'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const test_module_descriptor = require('./../module_descriptors/CANTEST_165_2_117.json');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const fs = require('fs')
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const MNS_tests = require('./../MinimumNodeServiceTests.js');
const fetch_file = require('./../fetch_module_descriptor.js')

// Assert style
var assert = require('chai').assert;

const NET_PORT = 5550;
const NET_ADDRESS = "127.0.0.1"



describe('MERGLCB tests', function(){
	let mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	let  Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	let target = new MNS_tests.MinimumNodeServiceTests(Network);

    // targets have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    let test_timeout = target.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		winston.info({message: '======================================================================'});
		winston.info({message: '----------------------- MERGLCB unit tests -------------------'});
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


    //
    itParam("RQNN test nodeNumber ${value.nodeNumber}", GetTestCase_RQNN(), function (done, value) {
		winston.info({message: 'UNIT TEST: BEGIN RQNN test'});
        mock_Cbus.enterSetup(value.nodeNumber);
		setTimeout(function(){
			target.checkForRQNN();
            expect(target.inSetupMode).to.equal(true);
            expect(target.test_nodeNumber).to.equal(value.nodeNumber);
            winston.info({message: 'UNIT TEST: RQNN ended'});
            mock_Cbus.exitSetup(value.nodeNumber);
			done();
		}, test_timeout);
	})


    //
	it("RQNP test", function (done) {
		winston.info({message: 'UNIT TEST: BEGIN RQNP test'});
        mock_Cbus.enterSetup(0);
        var result = target.test_RQNP();
		setTimeout(function(){
            expect(target.hasTestPassed).to.equal(true);
            winston.info({message: 'UNIT TEST: RQNP ended'});
            mock_Cbus.exitSetup(0);
			done();
		}, test_timeout);
	})


    //
	it("RQMN test", function (done) {
		winston.info({message: 'UNIT TEST: BEGIN RQMN test'});
        var result = target.test_RQMN();
		setTimeout(function(){
            expect(target.hasTestPassed).to.equal(true);
            winston.info({message: 'UNIT TEST: RQMN ended'});
			done();
		}, test_timeout);
	})


    //
	it("SNN test", function (done) {
		winston.info({message: 'UNIT TEST: BEGIN SNN test'});
        var result = target.test_SNN();
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: SNN ended'});
            expect(target.hasTestPassed).to.equal(true);
			done();
		}, test_timeout);
	})

    
	it("QNN test", function (done) {
		winston.info({message: 'UNIT TEST: BEGIN QNN test'});
        var result = target.test_QNN(0);
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: QNN ended'});
            expect(target.hasTestPassed).to.equal(true);
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
        var result = target.test_RQNPN(value.parameterIndex, test_module_descriptor);
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: RQNPN ended'});
            expect(target.hasTestPassed).to.equal(true);
			done();
		}, test_timeout);
	})


    //
	it("test_harness", function (done) {
        target.test_harness();
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: Harness ended'});
            expect(target.hasTestPassed).to.equal(true);
			done();
		}, test_timeout);
    })

    //
	it("test_module_descriptor_read_pass", function () {
		
		// setup module variables
		var retrieved_values = {};
		retrieved_values["NAME"] = 'CANTEST'; 
		retrieved_values["Manufacturer’s Id"] = '165'; 
		retrieved_values["Major Version"] = '2';
		retrieved_values["Minor Version"]  = '117';
		
        var module_descriptor = fetch_file.module_descriptor(retrieved_values);
        assert.exists(module_descriptor, 'module_descriptor is either `null` nor `undefined`');
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor)}`});
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor.nodeParameters["0"].name)}`});
        winston.info({message: 'UNIT TEST: module_descriptor_read ended'});
    })

	it("test_module_descriptor_read_fail", function () {
        var module_descriptor = fetch_file.module_descriptor('./module_descriptors/does_not_exist.json');
        assert.notExists(module_descriptor, 'module_descriptor is neither `null` nor `undefined`');

        winston.info({message: 'UNIT TEST: module_descriptor_read ended'});
    })


})