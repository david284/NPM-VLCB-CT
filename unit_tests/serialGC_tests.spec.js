'use strict';
const expect = require('chai').expect;
const winston = require('./config/winston_test.js');
const itParam = require('mocha-param');
const SerialGC = require('../serialGC.js');
const cbusLib = require('cbuslibrary');
const utils = require('../utilities.js');
const assert = require('chai').assert;

describe('serialGC unit tests', function(){
	const serialGC = new SerialGC.SerialGC('MOCK_PORT');

	before(function() {
    utils.DisplayUnitTestHeader('SerialGC unit tests');
	})
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
    // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
      // timeout to allow tests to print
      utils.DisplayUnitTestFooter('SerialGC unit tests finished');
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
	it("serialGC receive", function (done) {
    winston.info({message: 'UNIT TEST: BEGIN serialGC receive test'});
    serialGC.messagesIn = []                         // clear messageIn array
    serialGC.testStarted = true                      // enables info display
    var msgData = cbusLib.encodeACK()
    serialGC.serialPort.port.emitData(msgData);
    setTimeout(function(){
      winston.debug({message: 'UNIT TEST: serialGC mesageIn count ' + serialGC.messagesIn.length});
      winston.info({message: 'UNIT TEST: END serialGC receive test'});
      expect(serialGC.messagesIn[0].encoded).to.equal(msgData);
			done();
		}, 10);
  })

  //
	it("serialGC receive module debug", function (done) {
    winston.info({message: 'UNIT TEST: BEGIN serialGC receive module debug test'});
    serialGC.messagesIn = []                         // clear messageIn array
    serialGC.testStarted = true                      // enables info display
    serialGC.serialPort.port.emitData("AAAAAAAAAA:");
    setTimeout(function(){
      winston.info({message: 'UNIT TEST: END serialGC receive module debug test'});
			done();
		}, 10);
  })

  //
	it("serialGC receive combined", function (done) {
    winston.info({message: 'UNIT TEST: BEGIN serialGC receive combined test'});
    serialGC.messagesIn = []                         // clear messageIn array
    serialGC.testStarted = true                      // enables info display
    var msgData = cbusLib.encodeACK() + "debug1:" + "debug2:" + cbusLib.encodeACK() + "debug3:"
    winston.info({message: 'UNIT TEST: test data '+ msgData});
    serialGC.serialPort.port.emitData(msgData);
    setTimeout(function(){
      winston.info({message: 'UNIT TEST: END serialGC receive combined test'});
			done();
		}, 10);
  })

  //
	it("serialGC receive combined2", function (done) {
    winston.info({message: 'UNIT TEST: BEGIN serialGC receive combined2 test'});
    serialGC.messagesIn = []                         // clear messageIn array
    serialGC.testStarted = true                      // enables info display
    var msgData ="debug1:" + "debug2:" + cbusLib.encodeACK() + "debug3:" + cbusLib.encodeACK()
    winston.info({message: 'UNIT TEST: test data '+ msgData});
    serialGC.serialPort.port.emitData(msgData);
    setTimeout(function(){
      winston.info({message: 'UNIT TEST: END serialGC receive combined2 test'});
			done();
		}, 10);
  })

	it("serialGC transmit", function (done) {
    winston.info({message: 'UNIT TEST: BEGIN serialGC transmit test'});
    var msgData = cbusLib.encodeQNN()
    serialGC.write(msgData);
    setTimeout(function(){
      var buffer = serialGC.serialPort.port.lastWrite
      winston.debug({message: 'UNIT TEST: serialGC last write ' + buffer.toString()});
      winston.info({message: 'UNIT TEST: END serialGC transmit test'});
      expect(buffer.toString()).to.equal(msgData);
			done();
		}, 10);
  })


})