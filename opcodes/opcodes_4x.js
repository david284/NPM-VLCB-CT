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


class opcodes_4x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_4x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.response_time = 500;
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
      setTimeout(()=>{
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
              if (msg.mnemonic == "NNACK"){
                this.hasTestPassed = true;
              }
            }
          })
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'SNN');
        resolve();
      } , this.response_time );
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
      setTimeout(()=>{
        var GRSPreceived = false;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if (msg.mnemonic == "GRSP"){
              GRSPreceived = true;
              if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
                if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                winston.debug({message: 'VLCB:      GRSP received: ' + msg.result})
                  if (msg.result == GRSP.OK) {
                    this.hasTestPassed = true;
                  } else {
                    winston.info({message: 'VLCB: GRSP result:'
                      + '\n  Expected ' + GRSP.OK
                      + '\n  Actual ' + msg.result}); 
                  }
                }else {
                  winston.info({message: 'VLCB: GRSP requestOpCode:'
                    + '\n  Expected ' + cbusLib.decode(msgData).opCode
                    + '\n  Actual ' + msg.requestOpCode}); 
                }
              } else {
                winston.info({message: 'VLCB: GRSP nodeNumber:' +
                  + '\n  Expected ' + cbusLib.decode(msgData).nodeNumber
                  + '\n  Actual ' + msg.nodeNumber}); 
              }
            }
          });
        }
        if (!GRSPreceived) { winston.info({message: 'VLCB: NNRSM Fail: no GRSP received'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NNRSM');
        resolve();
      } , 1000 );
    }.bind(this));
  }
	
	

}

module.exports = {
    opcodes_4x: opcodes_4x
}