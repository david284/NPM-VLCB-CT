'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const CANUSB4 = require('../canusb4.js');


// Assert style
var assert = require('chai').assert;



describe('canusb4 tests', function(){
	const canusb4 = new CANUSB4.CANUSB4('MOCK_PORT');


	before(function() {
		winston.info({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.info({message: '============================================================'});
		winston.info({message: '-------------------- canusb4 unit tests --------------------'});
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
            winston.info({message: 'UNIT TEST: canusb4 tests finished '});
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
	it("canusb4", function (done) {
    canusb4.serialPort.port.emitData("1234;");
    setTimeout(function(){
      winston.info({message: 'UNIT TEST: Harness ended'});
			done();
		}, 500);
  })


})