'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_8x = require('./../opcodes/opcodes_8x.js');


// Assert style
var assert = require('chai').assert;

const NET_PORT = 5557;
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_8x tests', function(){
	let mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	let Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	let tests = new opcodes_8x.opcodes_8x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    let test_timeout = tests.response_time + 100;

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




    // 0x87 - RDGN
	it("RDGN test", function (done) {
		winston.info({message: 'UNIT TEST:: BEGIN RDGN test'});
		// storage for values retrieved from module under test	
		var retrieved_values = { "Services": { "1": { "ServiceIndex": 1 }, "2": { "ServiceIndex": 2 },  "3": { "ServiceIndex": 255 } } };
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