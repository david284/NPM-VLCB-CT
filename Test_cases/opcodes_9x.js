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
    this.defaultTimeout = 250
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == nodeNumber) {
            // ok - it's the right node
            if (msg.mnemonic == "ARON"){
              this.hasTestPassed = true;
              comment = ' - received ARON'
            }
            if (msg.mnemonic == "AROF"){
              this.hasTestPassed = true;
              comment = ' - received AROF'
            }
          }
        });
        if(!this.hasTestPassed){ comment = ' - missing expected ARON or AROF' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'AREQ (0x92)', comment);
        resolve(this.hasTestPassed);
      }, this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "WRACK"){
              this.hasTestPassed = true;
              comment = ' - received WRACK'
            }
          } else {
            if (msg.mnemonic == "WRACK"){
              winston.info({message: 'VLCB:       WARN: WRACK from unexpected node ' + msg.nodeNumber});
            }
          }
        });
        if(!this.hasTestPassed){ comment = ' - missing expected WRACK' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVULN (0x95)', comment);
        resolve(this.hasTestPassed);
      }, this.defaultTimeout );
    }.bind(this));
	} // end Test_EVULN


	// 0x95 - EVULN
  // Format: [<MjPri><MinPri=3><CANID>]<95><NN hi><NN lo><EN hi><EN lo>
  test_EVULN_INVALID_EVENT(RetrievedValues,eventIdentifier) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN EVULN_INVALID_EVENT test - eventIdentifier ' + eventIdentifier});
      this.hasTestPassed = false;
      var msgBitField = 0;	// bit field to capture when each message has been received
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      winston.debug({message: 'VLCB: EVULN_INVALID_EVENT test: eventNodeNumber ' + eventNodeNumber + ' eventNumber ' + eventNumber});
      var msgData = cbusLib.encodeEVULN(eventNodeNumber, eventNumber);
      winston.debug({message: 'VLCB: EVULN_INVALID_EVENT test: msgData ' + msgData});
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "CMDERR"){
              msgBitField |= 1;			// set bit 0
              if (msg.errorNumber == GRSP.InvalidEvent) {
                comment += ' - CMDERR Invalid Event received'
                msgBitField |= 2;			// set bit 1
              } else {
                comment = ' - CMDERR: expected '+ GRSP.InvalidEvent + ' received ' + msg.errorNumber
                winston.info({message: 'VLCB:      FAIL' + comment}); 
              }
            }
            if (msg.mnemonic == "GRSP"){
              msgBitField |= 4;			// set bit 2
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.InvalidEvent){
                  comment += ' - GRSP Invalid Event received'
                  msgBitField |= 8;			// set bit 3
                } else {
                  comment += ' - GRSP: expected result ' + GRSP.InvalidEvent + ' but received ' + msg.result;
                  winston.info({message: 'VLCB:      ' + comment}); 
                }
              } else{
                comment += ' - GRSP: expected requested opcode ' + cbusLib.decode(msgData).opCode
                + ' but received ' + msg.requestOpCode;
                winston.info({message: 'VLCB:      ' + comment}); 
              }
            }
          }
        });
        if (msgBitField == 15) {this.hasTestPassed =  true} 
        // check for missing messages
        if ((msgBitField & 1) == 0){ comment +=' - CMDERR message missing' }
        if ((msgBitField & 4) == 0){ comment += ' - GRSP message missing' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVULN_INVALID_EVENT (0x95)', comment);
        resolve(this.hasTestPassed);
      }, this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "GRSP"){
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.Invalid_Command) {
                  this.hasTestPassed = true;
                  comment = ' - received expected GRSP'
                } else {
                  comment += ' - GRSP: expected result ' + GRSP.Invalid_Command + ' but received ' + msg.result;
                  winston.info({message: 'VLCB:      ' + comment}); 
                }
              } else {
                comment += ' - GRSP: expected requested opcode ' + cbusLib.decode(msgData).opCode
                + ' but received ' + msg.requestOpCode;
                winston.info({message: 'VLCB:      ' + comment}); 
              }
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVULN_SHORT (0x95)', comment);
        resolve(this.hasTestPassed);
      }, this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "WRACK"){
              this.hasTestPassed = true;
              comment = ' - WRACK received'
            }
          } else {
            if (msg.mnemonic == "WRACK"){
              winston.info({message: 'VLCB:       WARN: WRACK from unexpected node ' + msg.nodeNumber});
            }
          }
        });
        if(!this.hasTestPassed){ comment = ' - missing expected WRACK' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSET (0x96)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "CMDERR"){
              if (msg.errorNumber == GRSP.InvalidNodeVariableIndex) {
                this.hasTestPassed = true;
                comment = ' - received expected CMDERR Invalid Node Variable Index'
              } else {
                comment = ' - CMDERR: expected '+ GRSP.InvalidNodeVariableIndex + ' received ' + msg.errorNumber
                winston.info({message: 'VLCB:      FAIL' + comment}); 
              }
            }
            if (msg.mnemonic == "WRACK"){
              winston.info({message: 'VLCB:      WARN: unexpected WRACK response'}); 
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected CMDERR'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSET_INVALID_INDEX (0x96)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "GRSP"){
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.Invalid_Command) {
                  this.hasTestPassed = true;
                  comment = ' - received expected GRSP Invalid Command'
                } else {
                  comment += ' - GRSP: expected result ' + GRSP.Invalid_Command + ' but received ' + msg.result;
                  winston.info({message: 'VLCB:      ' + comment}); 
                }
              } else {
                comment += ' - GRSP: expected requested opcode ' + cbusLib.decode(msgData).opCode
                + ' but received ' + msg.requestOpCode;
                winston.info({message: 'VLCB:      ' + comment}); 
              }
            }
            if (msg.mnemonic == "WRACK"){
              winston.info({message: 'VLCB:      unexpected WRACK response'}); 
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSET_SHORT (0x96)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == nodeNumber) {
            // ok - it's the right node
            if (msg.mnemonic == "ARSON"){
              this.hasTestPassed = true;
              comment += ' - received ARSON'
            }
            if (msg.mnemonic == "ARSOF"){
              this.hasTestPassed = true;
              comment += ' - received ARSOF'
            }
          }
        });
        if(!this.hasTestPassed){ comment = ' - missing expected ARSON or ARSOF' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'ASRQ (0x9A)', comment);
        resolve(this.hasTestPassed);
      }, this.defaultTimeout );
    }.bind(this));
	} // end Test_ASRQ


} // end class

