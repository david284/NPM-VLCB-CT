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


module.exports = class opcodes_Bx {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_Bx Constructor'});
		
		this.network = NETWORK;
    this.hasTestPassed = false;
    this.defaultTimeout = 250
    }


	// 0xB2 - REQEV
  // Format: [<MjPri><MinPri=3><CANID>]<B2><NN hi><NN lo><EN hi><EN lo><EV# >
  test_REQEV(RetrievedValues, eventIdentifier, eventVariableIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN REQEV test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      var msgData = cbusLib.encodeREQEV(eventNodeNumber, eventNumber, eventVariableIndex);
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.mnemonic == "EVANS"){
            if ((msg.nodeNumber == eventNodeNumber) && (msg.eventNumber == eventNumber) && (msg.eventVariableIndex == eventVariableIndex)){
              this.hasTestPassed = true; 
              comment = ' - received EVANS message'
              // now store the value
              RetrievedValues.storeEventVariableValue(eventIdentifier, eventVariableIndex, msg.eventVariableValue)
            }
          }
        });
        if(!this.hasTestPassed){ comment = ' - missing expected EVANS message' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'REQEV (0xB2)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
	} // end Test_EVLRN


	// 0xB2 - REQEV_INVALID_EVENT
  // needs to be provided with an invalid event identifier for this test
  //
  // Format: [<MjPri><MinPri=3><CANID>]<B2><NN hi><NN lo><EN hi><EN lo><EV# >
  test_REQEV_INVALID_EVENT(RetrievedValues, eventIdentifier, eventVariableIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN REQEV_INVALID_EVENT test'});
      this.hasTestPassed = false;
      var msgBitField = 0;	// bit field to capture when each message has been received
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      var msgData = cbusLib.encodeREQEV(eventNodeNumber, eventNumber, eventVariableIndex);
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
                var commentCMDERR = ' - CMDERR: expected '+ GRSP.InvalidEvent + ' received ' + msg.errorNumber
                winston.info({message: 'VLCB:      FAIL' + commentCMDERR});
                comment += commentCMDERR
              }
            }
            if (msg.mnemonic == "GRSP"){
              msgBitField |= 4;			// set bit 2
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.InvalidEvent){
                  comment += ' - GRSP Invalid Event received'
                  msgBitField |= 8;			// set bit 3
                } else {
                  var commentGRSP1 = ' - GRSP: expected result ' + GRSP.InvalidEvent + ' but received ' + msg.result;
                  winston.info({message: 'VLCB:      ' + commentGRSP1}); 
                  comment += commentGRSP1
                }
              } else{
                var commentGRSP2 = ' - GRSP: expected requested opcode ' + cbusLib.decode(msgData).opCode
                + ' but received ' + msg.requestOpCode;
                winston.info({message: 'VLCB:      ' + commentGRSP2}); 
                comment += commentGRSP2
              }
            }
          }
        });
        if (msgBitField == 15) { this.hasTestPassed = true; }
        // check for missing messages
        if ((msgBitField & 1) == 0){ comment +=' - CMDERR message missing' }
        if ((msgBitField & 4) == 0){ comment += ' - GRSP message missing' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'REQEV_INVALID_EVENT (0xB2)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
	} // end Test_REQEV_INVALID_EVENT


	// 0xB2 - REQEV
  // Format: [<MjPri><MinPri=3><CANID>]<B2><NN hi><NN lo><EN hi><EN lo><EV# >
  test_REQEV_INVALID_INDEX(RetrievedValues, eventIdentifier, eventVariableIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN REQEV_INVALID_INDEX test'});
      this.hasTestPassed = false;
      var msgBitField = 0;	// bit field to capture when each message has been received
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      var msgData = cbusLib.encodeREQEV(eventNodeNumber, eventNumber, eventVariableIndex);
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "CMDERR"){
              msgBitField |= 1;			// set bit 0
              if (msg.errorNumber == GRSP.InvalidEventVariableIndex) {
                comment += ' - CMDERR Invalid Event Variable Index received'
                msgBitField |= 2;			// set bit 1
              } else {
                var commentCMDERR = ' - CMDERR: expected '+ GRSP.InvalidEventVariableIndex + ' received ' + msg.errorNumber
                winston.info({message: 'VLCB:      FAIL' + commentCMDERR});
                comment += commentCMDERR
              }
            }
            if (msg.mnemonic == "GRSP"){
              msgBitField |= 4;			// set bit 2
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.InvalidEventVariableIndex){
                  comment += ' - GRSP Invalid Event Variable Index received'
                  msgBitField |= 8;			// set bit 3
                } else {
                  var commentGRSP1 = ' - GRSP: expected result ' + GRSP.InvalidEventVariableIndex + ' but received ' + msg.result;
                  winston.info({message: 'VLCB:      ' + commentGRSP1}); 
                  comment += commentGRSP1
                }
              } else{
                var commentGRSP2 = ' - GRSP: expected requested opcode ' + cbusLib.decode(msgData).opCode
                + ' but received ' + msg.requestOpCode;
                winston.info({message: 'VLCB:      ' + commentGRSP2}); 
                comment += commentGRSP2
              }
            }
          }
        });
        if (msgBitField == 15) { this.hasTestPassed = true; }
        // check for missing messages
        if ((msgBitField & 1) == 0){ comment +=' - CMDERR message missing' }
        if ((msgBitField & 4) == 0){ comment += ' - GRSP message missing' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'REQEV_INVALID_INDEX (B2)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
	} // end Test_REQEV_INVALID_INDEX


	// 0xB2 - REQEV
  // Format: [<MjPri><MinPri=3><CANID>]<B2><NN hi><NN lo><EN hi><EN lo><EV# >
  test_REQEV_SHORT(RetrievedValues, eventIdentifier, eventVariableIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN REQEV_SHORT test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      var msgData = cbusLib.encodeREQEV(eventNodeNumber, eventNumber, eventVariableIndex);
			// :SB780NB200000001FF;
			// 12345678901234567890
			// truncate the 20 byte message to remove the last byte - remove last three bytes & add ';' to end
			msgData = msgData.substring(0,17) + ';'
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
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'REQEV_SHORT (0xB2)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
	} // end Test_REQEV_SHORT


} // end class

