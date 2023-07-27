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


class opcodes_8x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_8x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
    }


	
	// 0x87 - RDGN
	test_RDGN(RetrievedValues, ServiceIndex, DiagnosticCode) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN RDGN test - ServiceIndex ' + ServiceIndex});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
      //
      // Need to calculate an extended timeout if it's a '0' command that returns multiple messages
      var RDGN_timeout = 100;
      if ( ServiceIndex == 0) { RDGN_timeout = 1500; } 
      else if ( DiagnosticCode == 0) { RDGN_timeout = 500; }
      winston.debug({message: 'VLCB: RDGN_timeout set to ' + RDGN_timeout}); 
      
      // now create message and start test
      var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), ServiceIndex, DiagnosticCode);
      this.network.write(msgData);
      setTimeout(()=>{
        var nonMatchingCount = 0;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
              // ok - it's the right node
              if (msg.mnemonic == "DGN"){
                
                // lets findout if we have an entry for this service
                if (RetrievedValues.data.Services[msg.ServiceIndex] == null)
                {
                  winston.debug({message: 'VLCB:      No Matching service found for serviceIndex ' + msg.ServiceIndex});
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
        }
        
        var testType = "\'ServiceIndex " + ServiceIndex + " Diagnostic Code " + DiagnosticCode + "\'";
        if(ServiceIndex == 0) {	testType = "\'all services\'"; } // overwrite if index = 0
        if(ServiceIndex != 0) {
          if ( DiagnosticCode == 0) { 
            if(RetrievedValues.data.Services[ServiceIndex].diagnosticCodeExpectedBitfield != RetrievedValues.data.Services[ServiceIndex].diagnosticCodeReceivedBitfield) {
              winston.info({message: 'VLCB:      FAIL number of expected diagnostics do not match number of received diagnostics'});
              this.hasTestPassed = false
            }
          } 
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN ' + testType);
        resolve();
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
			setTimeout(()=>{
				if (this.network.messagesIn.length > 0){
					this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
							// ok - it's the right node
							// so expecting error message back, not DGN
							if (msg.mnemonic == "GRSP"){
								if (msg.result == GRSP.InvalidDiagnosticCode) {
									this.hasTestPassed = true;
								} else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.InvalidDiagnosticCode}); 
								}
							}
							if (msg.mnemonic == "DGN"){
								winston.info({message: 'VLCB:      FAIL expected error message but received DGN'});
							}
						}
					});
				}
				utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN_INVALID_DIAG');
				resolve();
				;} , 250
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
			setTimeout(()=>{
				if (this.network.messagesIn.length > 0){
					this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
							// ok - it's the right node
							// so expecting error message back, not DGN
							if (msg.mnemonic == "GRSP"){
								if (msg.result == GRSP.InvalidService) {
									this.hasTestPassed = true;
								} else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.InvalidService}); 
								}
							}
							if (msg.mnemonic == "DGN"){
								winston.info({message: 'VLCB:      FAIL expected error message but received DGN'});
							}
						}
					});
				}
				utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN_INVALID_SERVICE');
				resolve();
				;} , 250
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
			setTimeout(()=>{
				if (this.network.messagesIn.length > 0){
					this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
							// ok - it's the right node
							// so expecting error message back, not DGN
							if (msg.mnemonic == "GRSP"){
								if (msg.result == GRSP.Invalid_Command) {
									this.hasTestPassed = true;
								} else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.Invalid_Command}); 
								}
							}
							if (msg.mnemonic == "DGN"){
								winston.info({message: 'VLCB:      FAIL expected error message but received DGN'});
							}
						}
					});
				}
				utils.processResult(RetrievedValues, this.hasTestPassed, 'RDGN_SHORT');
				resolve();
				;} , 250
			);
		}.bind(this));
	} // end test_RDGN_SHORT


	// 0x8E - NVSETRD
	test_NVSETRD(RetrievedValues, ServiceIndex, nodeVariableIndex, nodeVariableValue) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN NVSETRD test - ServiceIndex ' + ServiceIndex});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSETRD(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
      this.network.write(msgData);
      setTimeout(()=>{
        var nonMatchingCount = 0;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
              // ok - it's the right node
              if (msg.mnemonic == "NVANS"){
                if (msg.nodeVariableIndex == nodeVariableIndex){
                  this.hasTestPassed = true;
                }                
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSETRD');
        resolve();
			} , 250 );
    }.bind(this));
	} // end Test_NVSETRD


	// 0x8E - NVSETRD
	test_NVSETRD_INVALID_INDEX(RetrievedValues, ServiceIndex, nodeVariableIndex, nodeVariableValue) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN NVSETRD_INVALID_INDEX test - ServiceIndex ' + ServiceIndex});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSETRD(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
      this.network.write(msgData);
      setTimeout(()=>{
        var nonMatchingCount = 0;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
              // ok - it's the right node
              if (msg.mnemonic == "GRSP"){
                if (msg.result == GRSP.InvalidNodeVariableIndex) {
                  this.hasTestPassed = true;
                } else {
                  winston.info({message: 'VLCB:      GRSP wrong result - expected ' + GRSP.InvalidNodeVariableIndex}); 
                }
              }
              if (msg.mnemonic == "NVANS"){
                winston.info({message: 'VLCB:      unexpected NVANS response'}); 
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSETRD_INVALID_INDEX');
        resolve();
			} , 250 );
    }.bind(this));
	} // end Test_NVSETRD_INVALID_INDEX


	// 0x8E - NVSETRD
	test_NVSETRD_SHORT(RetrievedValues, ServiceIndex, nodeVariableIndex, nodeVariableValue) {
		return new Promise(function (resolve, reject) {
			winston.debug({message: 'VLCB: BEGIN NVSETRD_SHORT test - ServiceIndex ' + ServiceIndex});
			this.hasTestPassed = false;
			this.network.messagesIn = [];
      // now create message and start test
      var msgData = cbusLib.encodeNVSETRD(RetrievedValues.getNodeNumber(), nodeVariableIndex, nodeVariableValue);
			// :SB780N8E03E80101;
			// 123456789012345678
			// truncate the 18 byte message to remove the last byte - remove last three bytes & add ';' to end
			msgData = msgData.substring(0,15) + ';'
      this.network.write(msgData);
      setTimeout(()=>{
        var nonMatchingCount = 0;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
              // ok - it's the right node
              if (msg.mnemonic == "GRSP"){
                if (msg.result == GRSP.Invalid_Command) {
                  this.hasTestPassed = true;
                } else {
                  winston.info({message: 'VLCB:      GRSP wrong result - expected ' + GRSP.Invalid_Command}); 
                }
              }
              if (msg.mnemonic == "NVANS"){
                winston.info({message: 'VLCB:      unexpected NVANS response'}); 
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVSETRD_SHORT');
        resolve();
			} , 250 );
    }.bind(this));
	} // end test_NVSETRD_SHORT




} // end class

module.exports = {
    opcodes_8x: opcodes_8x
}