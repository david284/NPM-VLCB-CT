'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const net = require('net')
const cbusLib = require('cbusLibrary');
const Mock_Cbus = require('./mock_CbusNetwork.js')
const IP_Network = require('./../ip_network.js')
const opcodes_9x = require('./../opcodes/opcodes_9x.js');
const RetrievedValues = require('./../RetrievedValues.js');



// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


// Assert style
const assert = require('chai').assert;

const NET_PORT = 5569;			// 5560 + opcode catagory offset
const NET_ADDRESS = "127.0.0.1"



describe('opcodes_9x tests', function(){
	const mock_Cbus = new Mock_Cbus.mock_CbusNetwork(NET_PORT);
	const Network = new IP_Network.IP_Network(NET_ADDRESS, NET_PORT);
	const tests = new opcodes_9x.opcodes_9x(Network);


    // mns_testss have their own timeouts, so need to reflect that and add a little bit
    // to ensure the unti tests don't timeout first
    const test_timeout = tests.response_time + 100;

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------------ opcodes_9x unit tests -------------------'});
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
            winston.info({message: 'UNIT TEST: opcodes_9x tests finished '});
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

function GetTestCase_NVSET() {
  var arg1, arg2, arg3, testCases = [];
  for (var a = 1; a< 4; a++) {
    if (a == 1) {arg1 = 0}
    if (a == 2) {arg1 = 1}
    if (a == 3) {arg1 = 65535}
    for (var b = 1; b < 4; b++) {
      if (b == 1) {arg2 = 0}
      if (b == 2) {arg2 = 1}
      if (b == 3) {arg2 = 2}
      for (var c = 1; c < 4; c++) {
        if (c == 1) {arg3 = 0}
        if (c == 2) {arg3 = 1}
        if (c == 3) {arg3 = 2}
        testCases.push({'nodeNumber':arg1, 'nodeVariableIndex':arg2, 'nodeVariableValue': arg3});
      }
    }
  }
  return testCases;
}


    // 0x96 - NVSET
    // Format: [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
    itParam("NVSET test ${JSON.stringify(value)}", GetTestCase_NVSET(), async function (value) {
      winston.info({message: 'UNIT TEST:: BEGIN NVSET test'});
      RetrievedValues.setNodeNumber(value.nodeNumber);
      await tests.test_NVSET(RetrievedValues, 1, value.nodeVariableIndex, value.nodeVariableValue);
      expect(tests.hasTestPassed).to.equal(true);  

      winston.info({message: 'UNIT TEST: NVSET ended'});
    })
    
    // 0x96 - NVSET
    // Format: [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
    it("NVSET_INVALID_INDEX", async function () {
      winston.info({message: 'UNIT TEST:: BEGIN NVSET_INVALID_INDEX test'});
      RetrievedValues.setNodeNumber(0);
      await tests.test_NVSET_SHORT(RetrievedValues, 1, 255, 0);
      expect(tests.hasTestPassed).to.equal(true);  

      winston.info({message: 'UNIT TEST: NVSET_INVALID_INDEX ended'});
    })

    // 0x96 - NVSET
    // Format: [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
    it("NVSET_SHORT", async function () {
      winston.info({message: 'UNIT TEST:: BEGIN NVSET_SHORT test'});
      RetrievedValues.setNodeNumber(0);
      await tests.test_NVSET_SHORT(RetrievedValues, 1, 1, 0);
      expect(tests.hasTestPassed).to.equal(true);  

      winston.info({message: 'UNIT TEST: NVSET_SHORT ended'});
    })
})

