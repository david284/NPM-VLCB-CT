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
        this.defaultTimeout = 250;
    }
	

  // 0x42 SNN
	//
  test_SNN(RetrievedValues) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN SNN test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeSNN(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            if (msg.mnemonic == "NNACK"){
              this.hasTestPassed = true;
              comment = ' - received NNACK message'
            }
          }
        })
        if(!this.hasTestPassed){ comment = ' - missing expected NNACK'; }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'SNN (0x42)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
  }
    
	
  // 0x4F - NNRSM
  test_NNRSM(RetrievedValues) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NNRSM test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeNNRSM(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
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
        if (!GRSPreceived) { comment = ' - no GRSP received'; }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NNRSM', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
  }
	
	
} // end class
