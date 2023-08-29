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


module.exports = class opcodes_8x {

  constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_8x Constructor'});
		
		this.network = NETWORK;
    this.hasTestPassed = false;
    this.defaultTimeout = 250
  }


	
	// 0x87 - RDGN
	test_RDGN(RetrievedValues, ServiceIndex, DiagnosticCode) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN RDGN test - ServiceIndex ' + ServiceIndex});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
      //
      // Need to calculate an extended timeout if it's a '0' command that returns multiple messages
      var RDGN_timeout = this.defaultTimeout;
      if ( ServiceIndex == 0) { RDGN_timeout = this.defaultTimeout*6; } 
      else if ( DiagnosticCode == 0) { RDGN_timeout = this.defaultTimeout*2; }
      winston.debug({message: 'VLCB: RDGN_timeout set to ' + RDGN_timeout}); 
      
      // now create message and start test
      var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), ServiceIndex, DiagnosticCode);
      this.network.write(msgData);
      var comment = ''
      var ServiceName = RetrievedValues.getServiceName(ServiceIndex);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "DGN"){
              
              // lets findout if we have an entry for this service
              if (RetrievedValues.data.Services[msg.ServiceIndex] == null)
              {
                comment += '- No Matching service found for serviceIndex ' + msg.ServiceIndex
                winston.debug({message: 'VLCB:      ' + comment});
                this.hasTestPassed = false;
              } else {
                // we have a matching service entry, so mark as passed
                this.hasTestPassed = true;
              }
              
              // store diagnostic code anyway, even if no matching service (will create a new service entry)
              RetrievedValues.addDiagnosticCode(msg.ServiceIndex, msg.DiagnosticCode, msg.DiagnosticValue);
            }
          }
        });
        if(ServiceIndex != 0) {
          if ( DiagnosticCode == 0) { 
            if(RetrievedValues.data.Services[ServiceIndex].diagnosticExpectedCount != RetrievedValues.data.Services[ServiceIndex].diagnosticReportedCount) {
              comment += ' - expected diagnostic count ' + RetrievedValues.data.Services[ServiceIndex].diagnosticExpectedCount +
                                    ' does not match received diagnostic count ' + RetrievedValues.data.Services[ServiceIndex].diagnosticReportedCount
              winston.info({message: 'VLCB:      FAIL' + comment });
              this.hasTestPassed = false
            }
            else if(RetrievedValues.data.Services[ServiceIndex].diagnosticCodeExpectedBitfield != RetrievedValues.data.Services[ServiceIndex].diagnosticCodeReceivedBitfield) {
              COMMENT += ' - mix of expected diagnostics do not match mix of received diagnostics'
              winston.info({message: 'VLCB:      FAIL' + comment});
              this.hasTestPassed = false
            }
          } 
        }
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - no response received to RDGN'; } }
        // add some context to result
        comment = " - " + ServiceName +" ServiceIndex " + ServiceIndex + " Diagnostic Code " + DiagnosticCode + comment;
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN (0x87)', comment);
        resolve(this.hasTestPassed);
			} , RDGN_timeout );
    }.bind(this));
	} // end Test_RDGN


	// 0x87 - RDGN_INVALID_DIAG
	test_RDGN_INVALID_DIAG(RetrievedValues, ServiceIndex, DiagnosticCode) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN RDGN_INVALID_DIAG test - ServiceIndex ' + ServiceIndex + " Diagnostic Code " + DiagnosticCode});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
			// now create message and start test
			var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), ServiceIndex, DiagnosticCode);
			this.network.write(msgData);
      var comment = ''
			setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            // so expecting error message back, not DGN
            if (msg.mnemonic == "GRSP"){
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.InvalidDiagnosticCode) {
                  this.hasTestPassed = true;
                  comment = ' - received expected GRSP'
                } else {
                  comment += ' - GRSP: expected result ' + GRSP.InvalidDiagnosticCode + ' but received ' + msg.result;
                  winston.info({message: 'VLCB:      ' + comment}); 
                }
              } else {
                comment += ' - GRSP: expected requested opcode ' + cbusLib.decode(msgData).opCode
                  + ' but received ' + msg.requestOpCode;
                winston.info({message: 'VLCB:      ' + comment}); 
              }
            }
            if (msg.mnemonic == "DGN"){
              winston.info({message: 'VLCB:      WARN -- expected error message but received DGN'});
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
				utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN_INVALID_DIAG (0x87)', comment);
				resolve(this.hasTestPassed);
				;} , this.defaultTimeout
			);
		}.bind(this));
	} // end test_RDGN_ERROR_DIAG


	// 0x87 - RDGN_INVALID_SERVICE
	test_RDGN_INVALID_SERVICE(RetrievedValues, ServiceIndex, DiagnosticCode) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN RDGN_INVALID_SERVICE test - ServiceIndex ' + ServiceIndex + " Diagnostic Code " + DiagnosticCode});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
			// now create message and start test
			var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), ServiceIndex, DiagnosticCode);
			this.network.write(msgData);
      var comment = ''
			setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            // so expecting error message back, not DGN
            if (msg.mnemonic == "GRSP"){
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.InvalidService) {
                  this.hasTestPassed = true;
                  comment = ' - received expected GRSP'
                } else {
                  comment += ' - GRSP: expected result ' + GRSP.InvalidService + ' but received ' + msg.result;
                  winston.info({message: 'VLCB:      ' + comment}); 
                }
              } else {
                comment += ' - GRSP: expected requested opcode ' + cbusLib.decode(msgData).opCode
                + ' but received ' + msg.requestOpCode;
                winston.info({message: 'VLCB:      ' + comment}); 
              }
            }
            if (msg.mnemonic == "DGN"){
              winston.info({message: 'VLCB:      FAIL expected error message but received DGN'});
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
				utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN_INVALID_SERVICE (0x87)', comment);
				resolve(this.hasTestPassed);
				;} , this.defaultTimeout
			);
		}.bind(this));
	} // end test_RDGN_ERROR_SERVICE


	// 0x87 - RDGN_SHORT
	test_RDGN_SHORT(RetrievedValues, ServiceIndex, DiagnosticCode) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN RDGN_SHORT test - ServiceIndex ' + ServiceIndex + " Diagnostic Code " + DiagnosticCode});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
			// now create message and start test
			var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), ServiceIndex, DiagnosticCode);
      // :SB780N8700000163;
      // 123456789012345678
			// truncate the 18 byte message to remove the node variable - remove last three bytes & add ';' to end
			msgData = msgData.substring(0,15) + ';'
			this.network.write(msgData);
      var comment = ''
			setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            // so expecting error message back, not DGN
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
            if (msg.mnemonic == "DGN"){
              winston.info({message: 'VLCB:      FAIL expected error message but received DGN'});
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
				utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN_SHORT (0x87)', comment);
				resolve(this.hasTestPassed);
				;} , this.defaultTimeout
			);
		}.bind(this));
	} // end test_RDGN_SHORT


	// 0x8E - NVSETRD
	test_NVSETRD(RetrievedValues, nodeVariableIndex, nodeVariableValue) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN NVSETRD test'});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSETRD(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "NVANS"){
              if (msg.nodeVariableIndex == nodeVariableIndex){
                this.hasTestPassed = true;
                comment = ' - received NVANS message'
              }                
            }
          }
        });
        if(!this.hasTestPassed){ comment = ' - missing expected NVANS' }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSETRD (0x8E)', comment);
        resolve(this.hasTestPassed);
			} , this.defaultTimeout );
    }.bind(this));
	} // end Test_NVSETRD


	// 0x8E - NVSETRD
	test_NVSETRD_INVALID_INDEX(RetrievedValues, nodeVariableIndex, nodeVariableValue) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN NVSETRD_INVALID_INDEX test'});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSETRD(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            // ok - it's the right node
            if (msg.mnemonic == "GRSP"){
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.InvalidNodeVariableIndex) {
                  this.hasTestPassed = true;
                  comment = ' - received expected GRSP'
                } else {
                  comment += ' - GRSP: expected result ' + GRSP.InvalidNodeVariableIndex + ' but received ' + msg.result;
                  winston.info({message: 'VLCB:      ' + comment}); 
                }
              } else {
                comment += ' - GRSP: expected requested opcode ' + cbusLib.decode(msgData).opCode
                + ' but received ' + msg.requestOpCode;
                winston.info({message: 'VLCB:      ' + comment}); 
              }
            }
            if (msg.mnemonic == "NVANS"){
              winston.info({message: 'VLCB:      unexpected NVANS response'}); 
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSETRD_INVALID_INDEX (0x8E)', comment);
        resolve(this.hasTestPassed);
			} , this.defaultTimeout );
    }.bind(this));
	} // end Test_NVSETRD_INVALID_INDEX


	// 0x8E - NVSETRD
	test_NVSETRD_SHORT(RetrievedValues, nodeVariableIndex, nodeVariableValue) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN NVSETRD_SHORT test'});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSETRD(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
			// :SB780N8E03E80101;
			// 123456789012345678
			// truncate the 18 byte message to remove the last byte - remove last three bytes & add ';' to end
			msgData = msgData.substring(0,15) + ';'
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
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
            if (msg.mnemonic == "NVANS"){
              winston.info({message: 'VLCB:      unexpected NVANS response'}); 
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSETRD_SHORT (0x8E)', comment);
        resolve(this.hasTestPassed);
			} , this.defaultTimeout );
    }.bind(this));
	} // end test_NVSETRD_SHORT


} // end class

