'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const example_tests = require('./../Test_cases/example_testCase.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;
const RetrievedValues = require('./../RetrievedValues.js');

describe('example_testCase unit tests', function(){
	const examples = new example_tests();

	before(function() {
    utils.DisplayUnitTestHeader('example_testCase unit tests');
  })
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      utils.DisplayUnitTestFooter('example_testCase unit tests finished');
      setTimeout(function(){
        // timeout to allow the finish text above to print
        done();
      }, 100);
		}, 100);
  });


///////////////////////////////////////////////////////////////////////////////
//
// 						Testing examples tests
//

    //
	it("test_harness", async function () {
    winston.info({message: 'UNIT TEST: BEGIN test_harness test'});
		var result = await examples.test_harness(RetrievedValues);
    winston.info({message: 'UNIT TEST: END test_harness test'});
    expect(examples.hasTestPassed).to.equal(true);
  })

    //
    it("test_wait", async function () {
      winston.info({message: 'UNIT TEST: BEGIN test_wait test'});
      var result = await examples.test_wait(RetrievedValues);
      winston.info({message: 'UNIT TEST: END test_wait test'});
      expect(examples.hasTestPassed).to.equal(true);
    })
  
  
})