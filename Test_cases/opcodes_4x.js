'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');
const GRSP = require('./../Definitions/GRSP_definitions.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


module.exports = class opcodes_4x {

  constructor(NETWORK) {
    //                        0123456789012345678901234567890123456789
    winston.debug({message:  '----------------- opcodes_4x Constructor'});
    
    this.network = NETWORK;
    this.hasTestPassed = false;
  }
	

  // 0x42 SNN
	//
  async test_SNN(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN SNN test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeSNN(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1000 seconds, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
          if (msg.mnemonic == "NNACK"){
            this.hasTestPassed = true;
            comment = ' - received NNACK message'
          }
        }
      })
      if(this.hasTestPassed){ break; }
    }

    if(!this.hasTestPassed){ comment = ' - missing expected NNACK'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'SNN (0x42)', comment);
    return this.hasTestPassed
  }
    
	
  // 0x4F - NNRSM
  async test_NNRSM(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NNRSM test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeNNRSM(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1000 seconds, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      var GRSPreceived = false;
      this.network.messagesIn.forEach(msg => {
        if (msg.mnemonic == "GRSP"){
          GRSPreceived = true;
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
            winston.debug({message: 'VLCB:      GRSP received: ' + msg.result})
              if (msg.result == GRSP.OK) {
                this.hasTestPassed = true;
                comment = ' - GPRS OK received'
              } else {
                comment = ' - GRSP result:  Expected ' + GRSP.OK + ' Actual ' + msg.result
                winston.info({message: 'VLCB:      ' + comment}); 
              }
            }else {
              comment = 'GRSP requestOpCode: Expected ' + cbusLib.decode(msgData).opCode
              + ' Actual ' + msg.requestOpCode
              winston.info({message: 'VLCB:      ' + comment}); 
            }
          } else {
            comment = 'GRSP nodeNumber: Expected ' + cbusLib.decode(msgData).nodeNumber
            + ' Actual ' + msg.nodeNumber
            winston.info({message: 'VLCB:      ' + comment}); 
          }
        }
      });
      if(this.hasTestPassed){ break; }
    }

    if (!GRSPreceived) { comment = ' - no GRSP received'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NNRSM', comment);
    return this.hasTestPassed
  }
	
	
} // end class
