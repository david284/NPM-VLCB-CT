'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const example_tests = require('./../Test_suites/Tests_examples.js');
const utils = require('./../utilities.js');
const assert = require('chai').assert;

describe('example unit tests', function(){
	const examples = new example_tests();

	before(function() {
    utils.DisplayUnitTestHeader('example unit tests');
  })
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      utils.DisplayUnitTestFooter('example unit tests finished');
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
		var result = await examples.test_harness();
    winston.info({message: 'UNIT TEST: Harness ended'});
    expect(examples.hasTestPassed).to.equal(true);
  })


})