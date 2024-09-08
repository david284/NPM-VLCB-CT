'use strict';
const expect = require('chai').expect;
const winston = require('./../../config/winston_test.js');
const itParam = require('mocha-param');
const utils = require('./../../../utilities.js');
const assert = require('chai').assert;
const RetrievedValues = require('./../../../RetrievedValues.js');

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

    //
	it("universal inputs test", async function () {
    winston.info({message: 'UNIT TEST: BEGIN universal inputs test test'});
//		var result = await examples.test_harness(RetrievedValues);
    winston.info({message: 'UNIT TEST: END universal inputs test test'});
//    expect(examples.hasTestPassed).to.equal(true);
  })

  
  
})