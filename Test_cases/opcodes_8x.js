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
  }


	
	// 0x87 - RDGN
	async test_RDGN(RetrievedValues, requestedServiceIndex, DiagnosticCode) {
    winston.debug({message: 'VLCB: BEGIN RDGN test - ServiceIndex ' + requestedServiceIndex});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var comment = ''
    // now create message and start test
    var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), requestedServiceIndex, DiagnosticCode);
    this.network.write(msgData);
    var ServiceName = RetrievedValues.getServiceName(requestedServiceIndex);

    // assume diagnotic(s) for just one service requested
    var timeout = 2000
    // if requestedServiceIndex = 0, then we don't really know how many diagnostics will be returned
    // so base a timeout on the number of services that has been previously detected
    // and don't allow an early break;
    if (requestedServiceIndex == 0){
      timeout = 500 + RetrievedValues.data.ServicesActualCount * 100
    }
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    var startTime = Date.now();
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
          // ok - it's the right node
          if (msg.mnemonic == "DGN"){
            // so lets assume test has passed to begin with, and fail it later if checks fail
            this.hasTestPassed = true;
            // lets findout if we have an entry for this service
            if (RetrievedValues.data.Services[msg.ServiceIndex] == null)
            {
              comment += '- No Matching service found for serviceIndex ' + msg.ServiceIndex
              winston.debug({message: 'VLCB:      ' + comment});
              this.hasTestPassed = false;
            } 
            // store diagnostic code anyway, even if no matching service (will create a new service entry)
            RetrievedValues.addDiagnosticCode(msg.ServiceIndex, msg.DiagnosticCode, msg.DiagnosticValue);
          }
        }
      });
      if(requestedServiceIndex != 0) {
        if ( DiagnosticCode == 0) { 
          if(RetrievedValues.data.Services[requestedServiceIndex].diagnosticExpectedCount != RetrievedValues.data.Services[requestedServiceIndex].diagnosticReportedCount) {
            comment = ' - expected diagnostic count ' + RetrievedValues.data.Services[requestedServiceIndex].diagnosticExpectedCount +
                                  ' does not match received diagnostic count ' + RetrievedValues.data.Services[requestedServiceIndex].diagnosticReportedCount
            this.hasTestPassed = false
          }
          else if(RetrievedValues.data.Services[requestedServiceIndex].diagnosticCodeExpectedBitfield != RetrievedValues.data.Services[requestedServiceIndex].diagnosticCodeReceivedBitfield) {
            comment = ' - mix of expected diagnostics do not match mix of received diagnostics'
            this.hasTestPassed = false
          }
        } 
        // only allow break out early if single service requested
        if (this.hasTestPassed){ break; }
      }
    }
    if(!this.hasTestPassed){ if (comment == '') {comment = ' - no response received to RDGN'; } }
    // add some context to result
    comment = " - " + ServiceName +" ServiceIndex " + requestedServiceIndex + " Diagnostic Code " + DiagnosticCode + comment;
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN (0x87)', comment);
    return this.hasTestPassed
  } // end Test_RDGN


	// 0x87 - RDGN_INVALID_DIAG
	async test_RDGN_INVALID_DIAG(RetrievedValues, ServiceIndex, DiagnosticCode) {
    winston.debug({message: 'VLCB: BEGIN RDGN_INVALID_DIAG test - ServiceIndex ' + ServiceIndex + " Diagnostic Code " + DiagnosticCode});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var comment = ''
    // now create message and start test
    var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), ServiceIndex, DiagnosticCode);
    this.network.write(msgData);
    
    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN_INVALID_DIAG (0x87)', comment);
    return this.hasTestPassed
  } // end test_RDGN_ERROR_DIAG


	// 0x87 - RDGN_INVALID_SERVICE
	async test_RDGN_INVALID_SERVICE(RetrievedValues, ServiceIndex, DiagnosticCode) {
    winston.debug({message: 'VLCB: BEGIN RDGN_INVALID_SERVICE test - ServiceIndex ' + ServiceIndex + " Diagnostic Code " + DiagnosticCode});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    // now create message and start test
    var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), ServiceIndex, DiagnosticCode);
    this.network.write(msgData);
    var comment = ''
    
    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN_INVALID_SERVICE (0x87)', comment);
    return this.hasTestPassed
  } // end test_RDGN_ERROR_SERVICE


	// 0x87 - RDGN_SHORT
	async test_RDGN_SHORT(RetrievedValues, ServiceIndex, DiagnosticCode) {
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
  
    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN_SHORT (0x87)', comment);
    return this.hasTestPassed
  } // end test_RDGN_SHORT


	// 0x8E - NVSETRD
	async test_NVSETRD(RetrievedValues, nodeVariableIndex, nodeVariableValue) {
    winston.debug({message: 'VLCB: BEGIN NVSETRD test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    // now create message and start test
    var msgData = cbusLib.encodeNVSETRD(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ comment = ' - missing expected NVANS' }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSETRD (0x8E)', comment);
    return this.hasTestPassed
  } // end Test_NVSETRD


	// 0x8E - NVSETRD
	async test_NVSETRD_INVALID_INDEX(RetrievedValues, nodeVariableIndex, nodeVariableValue) {
    winston.debug({message: 'VLCB: BEGIN NVSETRD_INVALID_INDEX test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    // now create message and start test
    var msgData = cbusLib.encodeNVSETRD(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSETRD_INVALID_INDEX (0x8E)', comment);
    return this.hasTestPassed
  } // end Test_NVSETRD_INVALID_INDEX


	// 0x8E - NVSETRD
	async test_NVSETRD_SHORT(RetrievedValues, nodeVariableIndex, nodeVariableValue) {
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

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSETRD_SHORT (0x8E)', comment);
    return this.hasTestPassed
  } // end test_NVSETRD_SHORT


} // end class

