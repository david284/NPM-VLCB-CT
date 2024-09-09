'use strict';
const expect = require('chai').expect;
const winston = require('./../../config/winston_test.js');
const itParam = require('mocha-param');
const utils = require('./../../../utilities.js');
const assert = require('chai').assert;
const RetrievedValues = require('./../../../RetrievedValues.js');

const inputs = require('./../../../module_tests/universal/inputs.js');
const testAdapter = require('./../../../module_tests/universal/test_adapter.js')
const IP_Network = require('./../../../ip_network.js')
const Mock_Universal = require('./mock_universal.js')


const mock_universal = new Mock_Universal(5800);
const connection = new IP_Network("127.0.0.1", 5800);
const test_adapter = new testAdapter(connection, 65535)

describe('universal inputs unit tests', function(){

	before(function() {
    utils.DisplayUnitTestHeader('universal inputs unit tests');
  })
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      utils.DisplayUnitTestFooter('universal inputs unit tests finished');
      setTimeout(function(){
        // timeout to allow the finish text above to print
        done();
      }, 100);
		}, 100);
  });


///////////////////////////////////////////////////////////////////////////////
//
// 						tests
//
function GetTestCase_Channel() {
  var arg1, arg2, testCases = [];
  for (var a = 1; a<= 4; a++) {
    if (a == 1) {arg1 = 0, arg2 = false}
    if (a == 2) {arg1 = 1, arg2 = true}
    if (a == 3) {arg1 = 255, arg2 = true}
    testCases.push({'channel':arg1, 'expectedResult': arg2});
  }
  return testCases;
}

  //
  itParam("universal inputs test OFF ${JSON.stringify(value)}", GetTestCase_Channel(), async function (value) {
	  winston.info({message: 'UNIT TEST: BEGIN universal inputs test OFF'});
    RetrievedValues.setNodeNumber( 1 );
    let result = await inputs.test_input_off(connection, test_adapter, RetrievedValues, value.channel)
    winston.info({message: 'UNIT TEST: END universal inputs test OFF'});
    expect(result).to.equal(value.expectedResult);
  })

  

  //
  itParam("universal inputs test ON ${JSON.stringify(value)}", GetTestCase_Channel(), async function (value) {
	  winston.info({message: 'UNIT TEST: BEGIN universal inputs test ON'});
    RetrievedValues.setNodeNumber( 1 );
    let result = await inputs.test_input_on(connection, test_adapter, RetrievedValues, value.channel)
    winston.info({message: 'UNIT TEST: END universal inputs test ON'});
    expect(result).to.equal(value.expectedResult);
  })

  
  
})