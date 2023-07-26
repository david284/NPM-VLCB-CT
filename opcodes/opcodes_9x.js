'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const NodeParameterNames = require('./../Definitions/Text_NodeParameterNames.js');
const Service_Definitions = require('./../Definitions/Service_Definitions.js');
const utils = require('./../utilities.js');
const GRSP = require('./../Definitions/GRSP_definitions.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


class opcodes_9x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_8x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
    }


	// 0x96 - NVSET
  // Format:  [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
  test_NVSET(RetrievedValues, ServiceIndex, nodeVariableIndex, nodeVariableValue) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVSET test - ServiceIndex ' + ServiceIndex});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSET(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
      this.network.write(msgData);
      setTimeout(()=>{
        var nonMatchingCount = 0;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
              // ok - it's the right node
              if (msg.mnemonic == "WRACK"){
                winston.info({message: 'VLCB:      Set Node Variable ' + nodeVariableIndex + ' value ' + nodeVariableValue + ': WRACK message received as expected'});
                this.hasTestPassed = true;
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSET');
        resolve();
      } , 250 );
    }.bind(this));
	} // end Test_NVSET


	// 0x96 - NVSET
  // Format:  [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
  test_NVSET_INVALID_INDEX(RetrievedValues, ServiceIndex, nodeVariableIndex, nodeVariableValue) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVSET_INVALID_INDEX test - ServiceIndex ' + ServiceIndex});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSET(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
      this.network.write(msgData);
      setTimeout(()=>{
        var nonMatchingCount = 0;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
              // ok - it's the right node
              if (msg.mnemonic == "CMDERR"){
                winston.info({message: 'VLCB:      CMDERR received ' + msg.errorNumber}); 
                if (msg.errorNumber == GRSP.InvalidNodeVariableIndex) {
                  this.hasTestPassed = true;
                } else {
                  winston.info({message: 'VLCB:      CMDERR wrong error number - expected ' + GRSP.InvalidNodeVariableIndex}); 
                }
              }
              if (msg.mnemonic == "WRACK"){
                winston.info({message: 'VLCB:      unexpected WRACK response'}); 
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSET_INVALID_INDEX');
        resolve();
      } , 250 );
    }.bind(this));
	} // end test_NVSET_INVALID_INDEX


	// 0x96 - NVSET
  // Format:  [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
  test_NVSET_SHORT(RetrievedValues, ServiceIndex, nodeVariableIndex, nodeVariableValue) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVSET_SHORT test - ServiceIndex ' + ServiceIndex});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSET(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
			// :SB780N9600000000;
			// 123456789012345678
			// truncate the 18 byte message to remove the last byte - remove last three bytes & add ';' to end
			msgData = msgData.substring(0,15) + ';'
      this.network.write(msgData);
      setTimeout(()=>{
        var nonMatchingCount = 0;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
              // ok - it's the right node
              if (msg.mnemonic == "GRSP"){
                winston.info({message: 'VLCB:      GRSP received ' + msg.result}); 
                if (msg.result == GRSP.Invalid_Command) {
                  this.hasTestPassed = true;
                } else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.Invalid_Command}); 
                }
              }
              if (msg.mnemonic == "WRACK"){
                winston.info({message: 'VLCB:      unexpected WRACK response'}); 
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSET_SHORT');
        resolve();
      } , 250 );
    }.bind(this));
	} // end Test_NVSET_SHORT


} // end class

module.exports = {
    opcodes_9x: opcodes_9x
}