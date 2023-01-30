'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');

const utils = require('./../utilities.js');


// Assert style
var assert = require('chai').assert;



describe('utilities tests', function(){

	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '------------------- utilities unit tests -------------------'});
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
	it("Display Start Divider test", function (done) {
        utils.DisplayStartDivider('Start Divider');
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: Harness ended'});
			done();
		}, 500);
    })

    //
	it("Display End Divider test", function (done) {
        utils.DisplayEndDivider('End Divider');
		setTimeout(function(){
            winston.info({message: 'UNIT TEST: Harness ended'});
			done();
		}, 500);
    })




})