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
    this.defaultTimeout = 250;
    }


	// 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  test_EVLRN(RetrievedValues, eventIdentifier, eventVariableIndex, eventVariableValue) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN EVLRN test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      var msgData = cbusLib.encodeEVLRN(eventNodeNumber, eventNumber, eventVariableIndex, eventVariableValue);
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "WRACK"){ 
              this.hasTestPassed = true; 
              comment = ' - received WRACK message'
            }
          }
        });
        if(!this.hasTestPassed){ comment = ' - missing expected WRACK' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVLRN (0xD2)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
	} // end Test_EVLRN


	// 0xD2 - EVLRN_INVALID_EVENT
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  test_EVLRN_INVALID_EVENT(RetrievedValues, eventIdentifier, eventVariableIndex, eventVariableValue) {
    return new Promise(function (resolve, reject) {      
      winston.debug({message: 'VLCB: BEGIN EVLRN_INVALID_EVENT test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      var msgData = cbusLib.encodeEVLRN(eventNodeNumber, eventNumber, eventVariableIndex, eventVariableValue);
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "CMDERR"){
              if (msg.errorNumber == GRSP.InvalidEvent) {
                this.hasTestPassed = true;
                comment = ' - received expected CMDERR Invalid Event'
              } else {
                comment = ' - CMDERR: expected '+ GRSP.InvalidEvent + ' received ' + msg.errorNumber
                winston.info({message: 'VLCB:      FAIL' + comment}); 
              }
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected CMDERR'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVLRN_INVALID_EVENT (0xD2)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
	} // end Test_EVLRN_INVALID_EVENT


	// 0xD2 - EVLRN_INVALID_INDEX/
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  test_EVLRN_INVALID_INDEX(RetrievedValues, eventIdentifier, eventVariableIndex, eventVariableValue) {
    return new Promise(function (resolve, reject) {      
      winston.debug({message: 'VLCB: BEGIN EVLRN_INVALID_INDEX test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      var msgData = cbusLib.encodeEVLRN(eventNodeNumber, eventNumber, eventVariableIndex, eventVariableValue);
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "CMDERR"){
              if (msg.errorNumber == GRSP.InvalidEventVariableIndex) {
                this.hasTestPassed = true;
                comment = ' - received expected CMDERR Invalid Event Variable Index'
              } else {
                comment = ' - CMDERR: expected '+ GRSP.InvalidEventVariableIndex + ' received ' + msg.errorNumber
                winston.info({message: 'VLCB:      FAIL' + comment}); 
              }
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected CMDERR'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVLRN_INVALID_INDEX (0xD2)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
	} // end test_EVLRN_INVALID_INDEX


	// 0xD2 - EVLRN
  // Format: [<MjPri><MinPri=3><CANID>]<D2><NN hi><NN lo><EN hi><EN lo><EV#><EV val>
  test_EVLRN_SHORT(RetrievedValues, eventIdentifier, eventVariableIndex, eventVariableValue) {
    return new Promise(function (resolve, reject) {      
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
        utils.processResult(RetrievedValues, this.hasTestPassed, 'EVLRN_SHORT (0xD2)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
	} // end Test_EVLRN_SHORT


} // end class

