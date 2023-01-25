'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_8x = require('./../opcodes/opcodes_8x.js');


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


	// 0x87
	//
	// what we want to test
	// Service index	Service type	Service Version		Diagnostic Code
	//		1				1				1					1				//
	//		1				1				1					2				// change of code
	//		2				1				1					1				// change of index - same type
	//		3				2				1					1				// change of index, change of type
	//		4				1				2					1				// change of index, change of version

	// values to output from mockCbus - ServiceIndex, DiagnosticCode, DiagnosticValue
	var DGN_Outputs = {
				"1": { "ServiceIndex": 1, "DiagnosticCode": 1, "DiagnosticValue": 1 }, 
				"2": { "ServiceIndex": 1, "DiagnosticCode": 2, "DiagnosticValue": 2 },  
				"3": { "ServiceIndex": 2, "DiagnosticCode": 1, "DiagnosticValue": 3 },  
				"4": { "ServiceIndex": 3, "DiagnosticCode": 1, "DiagnosticValue": 4 }, 
				"5": { "ServiceIndex": 4, "DiagnosticCode": 1, "DiagnosticValue": 5 }
				};


    // 0x87 - RDGN
	it("RDGN test", function (done) {
		winston.info({message: 'UNIT TEST:: BEGIN RDGN test'});
		// storage for values retrieved from module under test	
		var retrieved_values = { "Services": { 
				"1": { "ServiceIndex": 1, "ServiceType": 1, "ServiceVersion": "1" }, 
				"2": { "ServiceIndex": 2, "ServiceType": 1, "ServiceVersion": 1 },  
				"3": { "ServiceIndex": 3, "ServiceType": 2, "ServiceVersion": "1" },  
				"4": { "ServiceIndex": 4, "ServiceType": 1, "ServiceVersion": 2 } } 
				};
		// set mock CBUS with diagnostic values to be sent in response to query
		mock_Cbus.DGN_Outputs = DGN_Outputs;
        var result = tests.test_RDGN(retrieved_values, 0, 0, 0);
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: RDGN ended'});
            winston.info({message: 'UNIT TEST: retrieved_values ' + JSON.stringify(retrieved_values, null, "    ")});
            expect(tests.hasTestPassed).to.equal(true);
//			expect(Object.keys(retrieved_values.Services).length).to.equal(3);			// should be three services
//			expect(retrieved_values.Services[0].ServiceType).to.equal(1);	// first service is type 1
			done();
		}, test_timeout);
	})


})

