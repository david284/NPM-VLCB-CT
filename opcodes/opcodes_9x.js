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


module.exports = class opcodes_9x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_9x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
    }


	// 0x92 - AREQ
  // Format: [<MjPri><MinPri=3><CANID>]<92><NN hi><NN lo><EN hi><EN lo>
  test_AREQ(RetrievedValues, nodeNumber, eventNumber) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN AREQ test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      winston.debug({message: 'VLCB: AREQ test: eventNodeNumber ' + nodeNumber + ' eventNumber ' + eventNumber});
      var msgData = cbusLib.encodeAREQ(nodeNumber, eventNumber);
      winston.debug({message: 'VLCB: AREQ test: msgData ' + msgData});
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == nodeNumber) {
            // ok - it's the right node
            if (msg.mnemonic == "ARON"){
              this.hasTestPassed = true;
            }
            if (msg.mnemonic == "AROF"){
              this.hasTestPassed = true;
            }
          }
        });
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected ARON or AROF'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'AREQ');
        resolve();
      }, 250 );
    }.bind(this));
	} // end Test_AREQ


	// 0x95 - EVULN
  // Format: [<MjPri><MinPri=3><CANID>]<95><NN hi><NN lo><EN hi><EN lo>
  test_EVULN(RetrievedValues,eventIdentifier) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN EVULN test - eventIdentifier ' + eventIdentifier});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      winston.debug({message: 'VLCB: EVULN test: eventNodeNumber ' + eventNodeNumber + ' eventNumber ' + eventNumber});
      var msgData = cbusLib.encodeEVULN(eventNodeNumber, eventNumber);
      winston.debug({message: 'VLCB: EVULN test: msgData ' + msgData});
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "WRACK"){
              this.hasTestPassed = true;
            }
          }
        });
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected WRACK'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVULN');
        resolve();
      }, 250 );
    }.bind(this));
	} // end Test_EVULN


	// 0x95 - EVULN
  // Format: [<MjPri><MinPri=3><CANID>]<95><NN hi><NN lo><EN hi><EN lo>
  test_EVULN_INVALID_EVENT(RetrievedValues,eventIdentifier) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN EVULN_INVALID_EVENT test - eventIdentifier ' + eventIdentifier});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      winston.debug({message: 'VLCB: EVULN_INVALID_EVENT test: eventNodeNumber ' + eventNodeNumber + ' eventNumber ' + eventNumber});
      var msgData = cbusLib.encodeEVULN(eventNodeNumber, eventNumber);
      winston.debug({message: 'VLCB: EVULN_INVALID_EVENT test: msgData ' + msgData});
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "CMDERR"){
              if (msg.errorNumber == GRSP.InvalidEvent) {
                this.hasTestPassed = true;
              } else {
                winston.info({message: 'VLCB:      CMDERR wrong error number - expected ' + GRSP.InvalidEvent}); 
              }
            }
          }
        });
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected CMDERR'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVULN_INVALID_EVENT');
        resolve();
      }, 250 );
    }.bind(this));
	} // end test_EVULN_INVALID_EVENT


	// 0x95 - EVULN
  // Format: [<MjPri><MinPri=3><CANID>]<95><NN hi><NN lo><EN hi><EN lo>
  test_EVULN_SHORT(RetrievedValues,eventIdentifier) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN EVULN_SHORT test - eventIdentifier ' + eventIdentifier});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      winston.debug({message: 'VLCB: EVULN_SHORT test: eventNodeNumber ' + eventNodeNumber + ' eventNumber ' + eventNumber});
      var msgData = cbusLib.encodeEVULN(eventNodeNumber, eventNumber);
      winston.debug({message: 'VLCB: EVULN_SHORT test: msgData ' + msgData});
			// :SB780N9500000000;
			// 123456789012345678
			// truncate the 18 byte message to remove the last byte - remove last three bytes & add ';' to end
			msgData = msgData.substring(0,15) + ';'
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "GRSP"){
              if (msg.result == GRSP.Invalid_Command) {
                this.hasTestPassed = true;
              } else {
                winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.Invalid_Command}); 
              }
            }
          }
        });
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected GRSP'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVULN_SHORT');
        resolve();
      }, 250 );
    }.bind(this));
	} // end test_EVULN_SHORT


	// 0x96 - NVSET
  // Format:  [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
  test_NVSET(RetrievedValues, nodeVariableIndex, nodeVariableValue) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVSET test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSET(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "WRACK"){
              this.hasTestPassed = true;
            }
          }
        });
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - expected WRACK'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSET');
        resolve();
      } , 250 );
    }.bind(this));
	} // end Test_NVSET


	// 0x96 - NVSET
  // Format:  [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
  test_NVSET_INVALID_INDEX(RetrievedValues, nodeVariableIndex, nodeVariableValue) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVSET_INVALID_INDEX test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSET(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "CMDERR"){
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
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected CMDERR'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSET_INVALID_INDEX');
        resolve();
      } , 250 );
    }.bind(this));
	} // end test_NVSET_INVALID_INDEX


	// 0x96 - NVSET
  // Format:  [<MjPri><MinPri=3><CANID>]<96><NN hi><NN lo><NV# ><NV val>
  test_NVSET_SHORT(RetrievedValues, nodeVariableIndex, nodeVariableValue) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVSET_SHORT test'});
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
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "GRSP"){
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
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected GRSP'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSET_SHORT');
        resolve();
      } , 250 );
    }.bind(this));
	} // end Test_NVSET_SHORT


	// 0x9A - ASRQ
  // Format: [<MjPri><MinPri=3><CANID>]<9A><NN hi><NN lo><EN hi><EN lo>
  test_ASRQ(RetrievedValues, nodeNumber, eventNumber) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN ASRQ test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      winston.debug({message: 'VLCB: ASRQ test: eventNodeNumber ' + nodeNumber + ' eventNumber ' + eventNumber});
      var msgData = cbusLib.encodeASRQ(nodeNumber, eventNumber);
      winston.debug({message: 'VLCB: ASRQ test: msgData ' + msgData});
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == nodeNumber) {
            // ok - it's the right node
            if (msg.mnemonic == "ARSON"){
              this.hasTestPassed = true;
            }
            if (msg.mnemonic == "ARSOF"){
              this.hasTestPassed = true;
            }
          }
        });
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected ARSON or ARSOF'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'ASRQ');
        resolve();
      }, 250 );
    }.bind(this));
	} // end Test_ASRQ


} // end class

