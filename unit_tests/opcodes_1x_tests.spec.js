'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js');
const RetrievedValues = require('./../RetrievedValues.js');
const opcodes_1x = require('./../opcodes/opcodes_1x.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


// Assert style
const assert = require('chai').assert;

const NET_PORT = 5561;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_1x tests', function(){
	const mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	const Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_1x.opcodes_1x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------------ opcodes_1x unit tests -------------------'});
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
      winston.info({message: '-------------- opcodes_1x unit tests finished --------------'});
      winston.info({message: '------------------------------------------------------------'});
      setTimeout(function(){
        // timeout to allow the finish text above to print
         done();
      }, 100);
		}, 100);
    });


///////////////////////////////////////////////////////////////////////////////
//
// 				Unit Tests
//

    //10 - RQNP
	//
	it("RQNP test", async function () {
		winston.info({message: 'UNIT TEST: BEGIN RQNP test'});
    mock_Cbus.enterSetup(0);
    await  tests.test_RQNP(RetrievedValues);
    expect(tests.hasTestPassed).to.equal(true);
    winston.info({message: 'UNIT TEST: RQNP ended'});
    mock_Cbus.exitSetup(0);
	})


    // 0x11 - RQMN
    //
	it("RQMN test", async function () {
		winston.info({message: 'UNIT TEST: BEGIN RQMN test'});
    await tests.test_RQMN(RetrievedValues);
    expect(tests.hasTestPassed).to.equal(true);
  	winston.info({message: 'UNIT TEST: RQMN ended'});
	})


})