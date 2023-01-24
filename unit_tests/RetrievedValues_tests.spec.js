'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const RetrievedValues = require('./../RetrievedValues.js');


// Assert style
var assert = require('chai').assert;



describe('RetrievedValues tests', function(){


	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '--------------- Retrieved Values unit tests ----------------'});
		winston.info({message: '============================================================'});
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
	it("RetrievedValues Constructor test", function () {
        winston.info({message: 'Constructed object \n' + JSON.stringify(RetrievedValues.retrieved_values, null, '    ')});        
//		expect(RetrievedValues.getNodeNumber()).to.equal(300);
    })

    //
	it("Node Number test", function () {
        RetrievedValues.setNodeNumber(300);
		expect(RetrievedValues.getNodeNumber()).to.equal(300);
    })

    //
	it("RetrievedValues Write test", function () {
        RetrievedValues.writeToDisk('./unit_tests/Retrieved Values unit test.txt');
    })


})