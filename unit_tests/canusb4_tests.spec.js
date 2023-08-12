'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const CANUSB4 = require('../canusb4.js');
const cbusLib = require('cbuslibrary');


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
	it("canusb4 receive", function (done) {
    winston.info({message: 'UNIT TEST: BEGIN canusb4 receive test'});
    canusb4.messagesIn = []                         // clear messageIn array
    canusb4.testStarted = true                      // enables info display
    var msgData = cbusLib.encodeACK()
    canusb4.serialPort.port.emitData(msgData);
    setTimeout(function(){
      winston.debug({message: 'UNIT TEST: canusb4 mesageIn count ' + canusb4.messagesIn.length});
      winston.info({message: 'UNIT TEST: END canusb4 receive test'});
      expect(canusb4.messagesIn[0]).to.equal(msgData);
			done();
		}, 100);
  })

	it("canusb4 transmit", function (done) {
    winston.info({message: 'UNIT TEST: BEGIN canusb4 transmit test'});
    var msgData = cbusLib.encodeQNN()
    canusb4.write(msgData);
    setTimeout(function(){
      var buffer = canusb4.serialPort.port.lastWrite
      winston.debug({message: 'UNIT TEST: canusb4 last write ' + buffer.toString()});
      winston.info({message: 'UNIT TEST: END canusb4 transmit test'});
      expect(buffer.toString()).to.equal(msgData);
			done();
		}, 100);
  })


})