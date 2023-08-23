'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const example_tests = require('./../Test_suites/example_testSuite.js');
let RetrievedValues = require('./../RetrievedValues.js');		// can't be const as we re-declare it with returned object
const utils = require('./../utilities.js');
const assert = require('chai').assert;

describe('example_testSuite unit tests', function(){
	const examples = new example_tests();

	before(function() {
    utils.DisplayUnitTestHeader('example_testSuite unit tests');
  })
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      utils.DisplayUnitTestFooter('example_testSuite unit tests finished');
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
	it("example_testSuite test", async function () {
    winston.info({message: 'UNIT TEST: BEGIN example_testSuite'});
		var result = await examples.runTests(RetrievedValues);
    winston.info({message: 'UNIT TEST: END example_testSuite'});
  })


})