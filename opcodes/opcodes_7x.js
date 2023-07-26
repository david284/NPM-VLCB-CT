'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbusLibrary');
const utils = require('./../utilities.js');
const NodeParameterNames = require('./../Definitions/Text_NodeParameterNames.js');
const Service_Definitions = require('./../Definitions/Service_Definitions.js');
const GRSP = require('./../Definitions/GRSP_definitions.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


class opcodes_7x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_7x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
    }


  // 0x71 - NVRD
  test_NVRD(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVRD test - serviceIndex ' + ServiceIndex + ' nodeVariableIndex ' + NodeVariableIndex});
      this.hasTestPassed = false;
      var timeout = 100;
      if (NodeVariableIndex == 0){ 
        if (RetrievedValues.data.nodeParameters[6] != null) { 
          timeout = timeout * RetrievedValues.data.nodeParameters[6].value; 
        } else {
          winston.info({message: 'VLCB: FAILURE:  Node Parameter[6] - number of node variables not found '});
        }
      }
      if (RetrievedValues.data.Services[ServiceIndex].nodeVariables == null) {
        RetrievedValues.data.Services[ServiceIndex]["nodeVariables"] = {};
      }
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeNVRD(RetrievedValues.getNodeNumber(), NodeVariableIndex);
      this.network.write(msgData);
      setTimeout(()=>{
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (msg.mnemonic == "NVANS"){
                this.hasTestPassed = true;
                RetrievedValues.data.Services[ServiceIndex].nodeVariables[msg.nodeVariableIndex] = msg.nodeVariableValue;
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD');
        resolve();
      } , timeout );
    }.bind(this));
  }

	
  // 0x71 - NVRD
	// request a node variable index that doesn't exist, should get a CMDERR & GRSP back
  test_NVRD_INVALID_INDEX(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVRD_INVALID_INDEX test - serviceIndex ' + ServiceIndex});
      this.hasTestPassed = false;
      var msgBitField = 0;	// bit field to capture when each message has been received
      // An index of 0 is invalid for this test...
      if (NodeVariableIndex != 0){ 
        this.hasTestPassed = false;
        this.network.messagesIn = [];
        var msgData = cbusLib.encodeNVRD(RetrievedValues.getNodeNumber(), NodeVariableIndex);
        this.network.write(msgData);
        setTimeout(()=>{
          if (this.network.messagesIn.length > 0){
            this.network.messagesIn.forEach(element => {
              var msg = cbusLib.decode(element);
              winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
              if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
                if (msg.mnemonic == "CMDERR"){
                  winston.info({message: 'VLCB:      CMDERR received ' + msg.errorNumber}); 
                  if (msg.errorNumber == GRSP.InvalidNodeVariableIndex) {
                    msgBitField |= 1;			// set bit 0
                  } else {
                    winston.info({message: 'VLCB:      CMDERR wrong error number - expected ' + GRSP.InvalidParameterIndex}); 
                  }
                }
                if (msg.mnemonic == "GRSP"){
                  winston.info({message: 'VLCB:      GRSP received ' + msg.result}); 
                  if (msg.result == GRSP.InvalidNodeVariableIndex) {
                    msgBitField |= 2;			// set bit 1
                  } else {
                    winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.InvalidParameterIndex}); 
                  }
                }
              }
            });
          }
  				if (msgBitField == 3) {
            // both messages has been received
            this.hasTestPassed = true;
          } else {
            if (msgBitField == 0){ winston.info({message: 'VLCB:      Fail: Both CMDERR & GRSP messages missing/incorrect'}); }
            if (msgBitField == 1){ winston.info({message: 'VLCB:      Fail: GRSP message missing/incorrect'}); }
            if (msgBitField == 2){ winston.info({message: 'VLCB:      Fail: CMDERR message missing/incorrect'}); }
            }

          utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD_INVALID_INDEX ');
          
          resolve();
          ;} , 250 );
        } else {
          winston.info({message: 'VLCB: **** NVRD_INVALID_INDEX Test Aborted **** Node Variable Index 0 requested'});				
        }
      }.bind(this));
  }
	
	
  // 0x71 - NVRD_SHORT
	// message is short, missing the Node Variable - GRSP expected
	test_NVRD_SHORT(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
		return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVRD_SHORT test - serviceIndex ' + ServiceIndex});
      this.hasTestPassed = false;
      // An index of 0 is invalid for this test...
      if (NodeVariableIndex != 0){ 
        this.hasTestPassed = false;
        this.network.messagesIn = [];
        var msgData = cbusLib.encodeNVRD(RetrievedValues.getNodeNumber(), NodeVariableIndex);
				// :SB780N7103E800;
				// 1234567890123456
        // truncate the 16 byte message to remove the node variable - remove last three bytes & add ';' to end
        msgData = msgData.substring(0,13) + ';'
        this.network.write(msgData);
        setTimeout(()=>{
          if (this.network.messagesIn.length > 0){
            this.network.messagesIn.forEach(element => {
              var msg = cbusLib.decode(element);
              winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
              if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
                if (msg.mnemonic == "GRSP"){
                  winston.info({message: 'VLCB:      GRSP received ' + msg.result}); 
                  if (msg.result == GRSP.Invalid_Command) {
                    this.hasTestPassed = true;
                  } else {
                    winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.Invalid_Command}); 
                  }
                }
              }
            });
          }

          utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD_SHORT ');
          
          resolve();
        } , 250 );
      } else {
        winston.info({message: 'VLCB: **** NVRD_SHORT Test Aborted **** Node Variable Index 0 requested'});				
      }
		}.bind(this));
  }




	// 0x73 - RQNPN
  test_RQNPN(RetrievedValues, module_descriptor, parameterIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: Get Param ' + parameterIndex});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), parameterIndex);
      this.network.write(msgData);
      setTimeout(()=>{
        // a warning outputstring
        var fail_output = "";
        var warning_output = "";
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (msg.mnemonic == "PARAN"){
                // ok - we have a value, so assume the test has passed - now do additional consistency tests
                // and fail the test if any of these tests fail
                this.hasTestPassed = true;					
                //start building the output string in case it fails
                fail_output += '\n      parameter index : ' + parameterIndex;
                fail_output += '\n      actual value : ' + msg.parameterValue;
                if (RetrievedValues.data["nodeParameters"][parameterIndex] != null){
                  fail_output += '\n      retrieved_value : ' + RetrievedValues.data["nodeParameters"][parameterIndex].value;
                  // we have previously read this value, so check it's still the same
                  if ( RetrievedValues.data["nodeParameters"][parameterIndex].value != msg.parameterValue){
                    this.hasTestPassed = false;
                    winston.debug({message: 'VLCB:      Failed Node - RetrievedValues value mismatch' + fail_output});  
                  }
                } else {
                  // new value, so save it
                  RetrievedValues.addNodeParameter(msg.parameterIndex, msg.parameterValue);
                  winston.debug({message: 'VLCB:      Node Parameter ' + parameterIndex + ' added to retrieved_values'});
                }
                // if it's in the module_descriptor, we need to check we've read the same value
                if (module_descriptor.nodeParameters[parameterIndex] != null) {
                  if (module_descriptor.nodeParameters[parameterIndex].value != null) {
                    fail_output += '\n      module_descriptor : ' + module_descriptor.nodeParameters[parameterIndex].value;
                    if ( module_descriptor.nodeParameters[parameterIndex].value != msg.parameterValue) {
                      this.hasTestPassed = false;
                      winston.debug({message: 'VLCB:      Failed module descriptor mismatch' + fail_output});
                    }
                  } else {
                    warning_output = ' :: Warning: No matching module_descriptor value entry';
                  }
                } else {
                  warning_output =  ' :: Warning: No matching module_descriptor file entry';
                }
              }
            }
          })
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNPN index ' + parameterIndex + ' ' + NodeParameterNames[parameterIndex], warning_output);
        resolve();
      } , 250 );
    }.bind(this));
  }
 
    
	// 0x73 - RQNPN - out of bounds test
  test_RQNPN_INVALID_INDEX(RetrievedValues, module_descriptor, parameterIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: Get Param ' + parameterIndex});
      this.hasTestPassed = false;
      var msgBitField = 0;	// bit field to capture when each message has been received
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), parameterIndex);
      this.network.write(msgData);
      setTimeout(()=>{
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (msg.mnemonic == "CMDERR"){
                winston.info({message: 'VLCB:      CMDERR received ' + msg.errorNumber}); 
                if (msg.errorNumber == GRSP.InvalidParameterIndex) {
                  msgBitField |= 1;			// set bit 0
                } else {
                  winston.info({message: 'VLCB:      CMDERR wrong error number - expected ' + GRSP.InvalidParameterIndex}); 
                }
              }
              if (msg.mnemonic == "GRSP"){
                winston.info({message: 'VLCB:      GRSP received ' + msg.result}); 
                if (msg.result == GRSP.InvalidParameterIndex) {
                  msgBitField |= 2;			// set bit 1
                } else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.InvalidParameterIndex}); 
                }
              }
              if (msg.mnemonic == "PARAN"){
                winston.info({message: 'VLCB:      unexpected PARAN response for index ' + parameterIndex}); 
              }
            }
          });
        }
        if (msgBitField == 3) {
          // both messages has been received
          this.hasTestPassed = true;
        } else {
          if (msgBitField == 0){ winston.info({message: 'VLCB:      Fail: Both CMDERR & GRSP messages missing/incorrect'}); }
          if (msgBitField == 1){ winston.info({message: 'VLCB:      Fail: GRSP message missing/incorrect'}); }
          if (msgBitField == 2){ winston.info({message: 'VLCB:      Fail: CMDERR message missing/incorrect'}); }
        }
      utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNPN_INVALID_INDEX');
        resolve();
      ;} , 250 );
    }.bind(this));
  }
 
    
	// 0x73 - RQNPN - short message
  test_RQNPN_SHORT(RetrievedValues, module_descriptor, parameterIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: Get Param ' + parameterIndex});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), parameterIndex);
			// :SB780N7303E815;
			// 1234567890123456
			// truncate the 16 byte message to remove the node variable - remove last three bytes & add ';' to end
			msgData = msgData.substring(0,13) + ';'
      this.network.write(msgData);
      setTimeout(()=>{
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (msg.mnemonic == "GRSP"){
                winston.info({message: 'VLCB:      GRSP received ' + msg.result}); 
                if (msg.result == GRSP.Invalid_Command) {
                  this.hasTestPassed = true;
                } else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.Invalid_Command}); 
                }
              }
              if (msg.mnemonic == "PARAN"){
                winston.info({message: 'VLCB:      RQNPN_SHORT: unexpected PARAN response for index ' + parameterIndex}); 
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNPN_SHORT');
        resolve();
      ;} , 250 );
    }.bind(this));
  }
 
    
	// 0x75 - CANID
	// ******* not fully implemented as depricated for VLCB *****
  test_CANID(retrieved_values, CANID) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN CANID test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeCANID(retrieved_values.nodeNumber, CANID);
      this.network.write(msgData);
      setTimeout(()=>{
        if (this.network.messagesIn.length > 0){
          // not implemented yet
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'CANID');
        resolve();
      }, 250 );
    }.bind(this));
  }
	
	
  // 0x76 - MODE
  test_MODE(RetrievedValues, MODE) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN MODE test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeMODE(RetrievedValues.getNodeNumber(), MODE);
      this.network.write(msgData);
      setTimeout(()=>{
        if (this.network.messagesIn.length > 0){
        this.network.messagesIn.forEach(element => {
          var msg = cbusLib.decode(element);
          winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
          if (msg.mnemonic == "GRSP"){
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              winston.info({message: 'VLCB:      MODE: GRSP received ' + msg.result}); 
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                this.hasTestPassed = true;
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
        utils.processResult(RetrievedValues, this.hasTestPassed, 'MODE');
  
        resolve();
      }, 250 );
    }.bind(this));
  }
	
	
	// 0x78 - RQSD
  test_RQSD(RetrievedValues, ServiceIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN RQSD test - serviceIndex ' + ServiceIndex});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeRQSD(RetrievedValues.getNodeNumber(), ServiceIndex);
      this.network.write(msgData);
      setTimeout(()=>{
      var msg_count = 0;	// we may want to compare the number of messages,so lets start a count
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (ServiceIndex == 0) {
                // service index is 0, so expecting one or more 'SD' messages
                if (msg.mnemonic == "SD"){
                  this.hasTestPassed = true;
                  if (msg.ServiceIndex == 0){
                    // special case that SD message with serviceIndex 0 has the service count in ther version field
                    RetrievedValues.data.ServicesReportedCount = msg.ServiceVersion;
                    this.hasTestPassed = true;	// accept test has passed if we get this one message
                    winston.info({message: 'VLCB:      Service Discovery : Service count ' + msg.ServiceVersion });
                  } else {
                    RetrievedValues.addService(msg.ServiceIndex, msg.ServiceType, msg.ServiceVersion);
                    winston.info({message: 'VLCB:      Service Discovery : '
                      + RetrievedValues.ServiceToString(msg.ServiceIndex)});
                  }
                }
              } else {
                // Service Index is non-zero, so expecting a single 'ESD' message for the service specified
                if (msg.mnemonic == "ESD"){
                  this.hasTestPassed = true;
                  RetrievedValues.addServiceData(msg.ServiceIndex, msg.Data1, msg.Data2, msg.Data3, msg.Data4);
                  winston.info({message: 'VLCB:      Service Discovery : '
                    + RetrievedValues.ServiceDataToString(msg.ServiceIndex)});
                }
              }
            }
          });
        }
        //
        // we can check we received SD messages for all the expected services if the requested serviceIndex was 0
        if ((ServiceIndex == 0) & (RetrievedValues.data.ServiceActualCount != RetrievedValues.data.ServiceReportedCount)) {
          winston.info({message: 'VLCB: RQSD failed - service count doesn\'t match'});
          this.hasTestPassed - false;
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQSD (ServiceIndex ' + ServiceIndex + ')');
        resolve();
      } , 250 );
    }.bind(this));
  }
    
	
	// 0x78 - RQSD_INVALID_SERVICE - service index out of bounds test
  test_RQSD_INVALID_SERVICE(RetrievedValues, ServiceIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN RQSD_INVALID_SERVICE test - serviceIndex ' + ServiceIndex});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeRQSD(RetrievedValues.getNodeNumber(), ServiceIndex);
      this.network.write(msgData);
      setTimeout(()=>{
        var msg_count = 0;	// we may want to compare the number of messages,so lets start a count
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              // expecting a GRSP message
              if (msg.mnemonic == "GRSP"){
                winston.info({message: 'VLCB:      GRSP received ' + msg.result}); 
                if (msg.result == GRSP.InvalidService) {
                  this.hasTestPassed = true;
                } else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.InvalidService}); 
                }
              }
              if (msg.mnemonic == "ESD"){
                this.hasTestPassed = false;
                RetrievedValues.addServiceData(msg.ServiceIndex, msg.Data1, msg.Data2, msg.Data3, msg.Data4);
                winston.info({message: 'VLCB:      RQSD_INVALID_SERVICE : unexpected ESD message'});
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQSD_INVALID_SERVICE (ServiceIndex ' + ServiceIndex + ')');
        resolve();
      } , 250 );
    }.bind(this));
  }
    	

	// 0x78 RQSD_SHORT - short message
  test_RQSD_SHORT(RetrievedValues, ServiceIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN RQSD_SHORT test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeRQSD(RetrievedValues.getNodeNumber(), ServiceIndex);
			// :SB780N78000004;
			// 1234567890123456
			// truncate the 16 byte message to remove the service index - remove last three bytes & add ';' to end
			msgData = msgData.substring(0,13) + ';'
      this.network.write(msgData);
      setTimeout(()=>{
        var msg_count = 0;	// we may want to compare the number of messages,so lets start a count
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              // expecting a GRSP message
              if (msg.mnemonic == "GRSP"){
                winston.info({message: 'VLCB:      GRSP received ' + msg.result}); 
                if (msg.result == GRSP.Invalid_Command) {
                  this.hasTestPassed = true;
                } else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.Invalid_Command}); 
                }
              }
              if (msg.mnemonic == "ESD"){
                this.hasTestPassed = false;
                RetrievedValues.addServiceData(msg.ServiceIndex, msg.Data1, msg.Data2, msg.Data3, msg.Data4);
                winston.info({message: 'VLCB:      unexpected ESD message'});
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQSD_SHORT');
        resolve();
      } , 250 );
    }.bind(this));
  }
    	

}

module.exports = {
    opcodes_7x: opcodes_7x
}