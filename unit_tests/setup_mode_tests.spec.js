'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbuslibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const SetupMode_tests = require('./../Test_suites/Tests_SetupMode.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;
let RetrievedValues = require('./../RetrievedValues.js');

const NET_PORT = 5555;
const NET_ADDRESS = "127.0.0.1"

describe('Setup Mode unit tests', function(){
	let mock_Cbus = new Mock_Cbus(NET_PORT);
	let  Network = new IP_Network(NET_ADDRESS, NET_PORT);
	const SetupMode = new SetupMode_tests(Network);


    // SetupMode have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    let test_timeout = SetupMode.response_time + 100;

	before(function() {
    utils.DisplayUnitTestHeader('Setup Mode unit tests');
	})
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
		Network.messagesIn = [];
    })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      utils.DisplayUnitTestFooter('Setup Mode unit tests finished');
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

	    //
      it("getNextFreeNodeNumber test", function () {
        winston.info({message: 'UNIT TEST: BEGIN getNextFreeNodeNumber test'});
        RetrievedValues.data.modules = {
          "200": {
            "nodeNumber": 200,
            "manufacturerId": 13,
            "moduleId": 0,
            "flags": 71,
            "CANID": 10
          },
          "201": {
              "nodeNumber": 201,
              "manufacturerId": 13,
              "moduleId": 10,
              "flags": 71,
              "CANID": 11
          }
        }
        expect(SetupMode.getNextFreeNodeNumber(200, RetrievedValues)).to.equal(202);
        winston.info({message: 'UNIT TEST: END getNextFreeNodeNumber test'});
      })
    
})