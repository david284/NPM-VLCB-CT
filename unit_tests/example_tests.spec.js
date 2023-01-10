'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const example_tests = require('./../Tests_examples.js');


// Assert style
var assert = require('chai').assert;



describe('example tests', function(){
	const examples = new example_tests.ExampleTests();


	before(function() {
		winston.info({message: ' '});
		winston.info({message: '======================================================================'});
		winston.info({message: '----------------------- Examples unit tests -------------------'});
		winston.info({message: '======================================================================'});
		winston.info({message: ' '});


	})
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
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
// 						Testing examples tests
//

    //
	it("test_harness", function (done) {
        examples.test_harness();
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: Harness ended'});
            expect(examples.hasTestPassed).to.equal(true);
			done();
		}, 500);
    })


})