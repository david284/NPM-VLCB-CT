'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const utils = require('./../utilities.js');
var assert = require('chai').assert;

describe('utilities unit tests', function(){

	before(function() {
    utils.DisplayUnitTestHeader('utilities unit tests');
	})
    
  beforeEach (function() {
    winston.info({message: ' '});   // blank line to separate tests
  })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      utils.DisplayUnitTestFooter('utilities unit tests finished');
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