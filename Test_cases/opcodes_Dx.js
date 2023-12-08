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


module.exports = class opcodes_Dx {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_Dx Constructor'});
		
		this.network = NETWORK;
    this.hasTestPassed = false;
    }


	// 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  async test_EVLRN(RetrievedValues, eventIdentifier, eventVariableIndex, eventVariableValue) {
    winston.debug({message: 'VLCB: BEGIN EVLRN test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    // now create message and start test
    var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
    var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
    var msgData = cbusLib.encodeEVLRN(eventNodeNumber, eventNumber, eventVariableIndex, eventVariableValue);
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 5.1 seconds, unless local unit tests running...
    var timeout = 5100;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
          // ok - it's the right node
          if (msg.mnemonic == "WRACK"){ 
            this.hasTestPassed = true; 
            comment = ' - received WRACK message'
          }
        }
      });
      if(this.hasTestPassed){ break; }
    }

    if(!this.hasTestPassed){ comment = ' - missing expected WRACK' }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'EVLRN (0xD2)', comment);
    return this.hasTestPassed
  } // end Test_EVLRN


	// 0xD2 - EVLRN_TOO_MANY_EVENTS
  // expects that the maximum number of events has already been reached
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  async test_EVLRN_TOO_MANY_EVENTS(RetrievedValues, eventIdentifier, eventVariableIndex, eventVariableValue) {
    winston.debug({message: 'VLCB: BEGIN EVLRN_TOO_MANY_EVENTS test'});
    this.hasTestPassed = false;
    var msgBitField = 0;	// bit field to capture when each message has been received
    this.network.messagesIn = [];
    // now create message and start test
    var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
    var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
    var msgData = cbusLib.encodeEVLRN(eventNodeNumber, eventNumber, eventVariableIndex, eventVariableValue);
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 5500 seconds, unless local unit tests running...
    var timeout = 5500;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
          // ok - it's the right node
          if (msg.mnemonic == "CMDERR"){
            msgBitField |= 1;			// set bit 0
            if (msg.errorNumber == GRSP.TooManyEvents) {
              comment += ' - CMDERR TooManyEvents received'
              msgBitField |= 2;			// set bit 1
            } else {
              var commentCMDERR = ' - CMDERR: expected '+ GRSP.TooManyEvents + ' received ' + msg.errorNumber
              winston.info({message: 'VLCB:      FAIL' + commentCMDERR});
              comment += commentCMDERR
            }
          }
          if (msg.mnemonic == "GRSP"){
            msgBitField |= 4;			// set bit 2
            if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
              if (msg.result == GRSP.TooManyEvents){
                comment += ' - GRSP TooManyEvents received'
                msgBitField |= 8;			// set bit 3
              } else {
                var commentGRSP1 = ' - GRSP: expected result ' + GRSP.TooManyEvents + ' but received ' + msg.result;
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
      if(this.hasTestPassed){ break; }
    }

    // check for missing messages
    if ((msgBitField & 1) == 0){ comment +=' - CMDERR message missing' }
    if ((msgBitField & 4) == 0){ comment += ' - GRSP message missing' }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'EVLRN_TOO_MANY_EVENTS (0xD2)', comment);
    return this.hasTestPassed

  } // end test_EVLRN_TOO_MANY_EVENTS


	// 0xD2 - EVLRN_INVALID_INDEX/
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  async test_EVLRN_INVALID_INDEX(RetrievedValues, eventIdentifier, eventVariableIndex, eventVariableValue) {
    winston.debug({message: 'VLCB: BEGIN EVLRN_INVALID_INDEX test'});
    this.hasTestPassed = false;
    var msgBitField = 0;	// bit field to capture when each message has been received
    this.network.messagesIn = [];
    // now create message and start test
    var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
    var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
    var msgData = cbusLib.encodeEVLRN(eventNodeNumber, eventNumber, eventVariableIndex, eventVariableValue);
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
      if(this.hasTestPassed){ break; }
    }

    // check for missing messages
    if ((msgBitField & 1) == 0){ comment +=' - CMDERR message missing' }
    if ((msgBitField & 4) == 0){ comment += ' - GRSP message missing' }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'EVLRN_INVALID_INDEX (0xD2)', comment);
    return this.hasTestPassed
	} // end test_EVLRN_INVALID_INDEX


	// 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  async test_EVLRN_SHORT(RetrievedValues, eventIdentifier, eventVariableIndex, eventVariableValue) {
    winston.debug({message: 'VLCB: BEGIN EVLRN_SHORT test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    // now create message and start test
    var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
    var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
    var msgData = cbusLib.encodeEVLRN(eventNodeNumber, eventNumber, eventVariableIndex, eventVariableValue);
    // :SB780ND2000000010101;
    // 1234567890123456789012
    // truncate the 22 byte message to remove the last byte - remove last three bytes & add ';' to end
    msgData = msgData.substring(0,19) + ';'
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
      if(this.hasTestPassed){ break; }
    }

    if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'EVLRN_SHORT (0xD2)', comment);
    return this.hasTestPassed
  } // end Test_EVLRN_SHORT


} // end class

