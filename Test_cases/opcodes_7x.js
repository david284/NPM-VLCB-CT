'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
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


module.exports = class opcodes_7x {

  constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_7x Constructor'});
		
		this.network = NETWORK;
    this.hasTestPassed = false;
    this.defaultTimeout = 250
  }


  // 0x71 - NVRD
  test_NVRD(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVRD test - serviceIndex ' + ServiceIndex + ' nodeVariableIndex ' + NodeVariableIndex});
      this.hasTestPassed = false;
      var comment = ''
      var timeout = this.defaultTimeout;
      if (NodeVariableIndex == 0){ 
        if (RetrievedValues.data.nodeParameters[6] != null) { 
          timeout = timeout * RetrievedValues.data.nodeParameters[6].value; 
        } else {
          winston.info({message: 'VLCB: FAILURE:  Node Parameter[6] - number of node variables not found '});
        }
      }
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeNVRD(RetrievedValues.getNodeNumber(), NodeVariableIndex);
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            if (msg.mnemonic == "NVANS"){
              this.hasTestPassed = true;
              comment = ' - received NVANS message'
              RetrievedValues.data.nodeVariables[msg.nodeVariableIndex] = msg.nodeVariableValue;
            }
          }
        });
        if(!this.hasTestPassed){ comment = ' - expected NVANS message'; }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD (0x71)', comment);
        resolve(this.hasTestPassed);
      } , timeout );
    }.bind(this));
  }

	
  // 0x71 - NVRD
	// request a node variable index that doesn't exist, should get a CMDERR & GRSP back
  test_NVRD_INVALID_INDEX(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN NVRD_INVALID_INDEX test - serviceIndex ' + ServiceIndex});
      this.hasTestPassed = false;
      var comment = ''
      var msgBitField = 0;	// bit field to capture when each message has been received
      // An index of 0 is invalid for this test...
      if (NodeVariableIndex != 0){ 
        this.hasTestPassed = false;
        this.network.messagesIn = [];
        var msgData = cbusLib.encodeNVRD(RetrievedValues.getNodeNumber(), NodeVariableIndex);
        this.network.write(msgData);
        setTimeout(()=>{
          this.network.messagesIn.forEach(msg => {
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (msg.mnemonic == "CMDERR"){
                  msgBitField |= 1;			// set bit 0
                if (msg.errorNumber == GRSP.InvalidNodeVariableIndex) {
                  msgBitField |= 2;			// set bit 1
                } else {
                  var commentCMDERR =' - CMDERR: expected '+ GRSP.InvalidParameterIndex + ' received ' + msg.errorNumber
                  winston.info({message: 'VLCB:      FAIL' + commentCMDERR});
                  comment += commentCMDERR 
                }
              }
              if (msg.mnemonic == "GRSP"){
                msgBitField |= 4;			// set bit 2
                if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                  if (msg.result == GRSP.InvalidNodeVariableIndex) {
                    msgBitField |= 8;			// set bit 3
                  } else {
                    var commentGRSP1 = ' - GRSP: expected ' + GRSP.InvalidParameterIndex + ' received ' + msg.result
                    winston.info({message: 'VLCB:      FAIL' + commentGRSP1 }); 
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
  				if (msgBitField == 15) {
            comment = ' -  CMDERR & GRSP messages has been received correctly'
            this.hasTestPassed = true;
          }
          if ((msgBitField & 1) == 0){ comment +=' - CMDERR message missing'; }
          if ((msgBitField & 4) == 0){ comment += ' - GRSP message missing'; }
          utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD_INVALID_INDEX (0x71)', comment); 
          resolve(this.hasTestPassed);
        ;} , this.defaultTimeout );
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
      var comment = ''
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
          this.network.messagesIn.forEach(msg => {
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (msg.mnemonic == "GRSP"){
                if (msg.result == GRSP.Invalid_Command) {
                  this.hasTestPassed = true;
                  comment = ' - GRSP Invalid Command received correctly'
                } else {
                  comment = 'GRSP wrong result number - expected ' + GRSP.Invalid_Command + ' received ' + msg.result
                  winston.info({message: 'VLCB:      ' + comment}); 
                }
              }
            }
          });
          if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
          utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD_SHORT (0x71)', comment);
          
          resolve(this.hasTestPassed);
        } , this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        // a warning outputstring
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            if (msg.mnemonic == "PARAN"){
              // ok - we have a value, so assume the test has passed - now do additional consistency tests
              // and fail the test if any of these tests fail
              this.hasTestPassed = true;					
              //start building the comment string now we have a PARAN message
              comment += ' - parameter index: ' + parameterIndex;
              comment += ' received value: ' + msg.parameterValue;
              if (RetrievedValues.data["nodeParameters"][parameterIndex] != null){
                // we have previously read this value, so check it's still the same
                if ( RetrievedValues.data["nodeParameters"][parameterIndex].value != msg.parameterValue){
                  this.hasTestPassed = false;
                  comment += ' retrieved value: ' + RetrievedValues.data["nodeParameters"][parameterIndex].value
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
                  if ( module_descriptor.nodeParameters[parameterIndex].value != msg.parameterValue) {
                    this.hasTestPassed = false;
                    comment += ' module descriptor value: ' + module_descriptor.nodeParameters[parameterIndex].value
                    winston.debug({message: 'VLCB:      Failed module descriptor mismatch' + fail_output});
                  }
                } else {
                  winston.debug({message: 'VLCB: :: info: No matching module_descriptor value entry'});
                }
              } else {
                winston.debug({message: 'VLCB: :: info: No matching module_descriptor file entry'});
              }
            }
          }
        })
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected PARAN message'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNPN (0x73)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            if (msg.mnemonic == "CMDERR"){
              msgBitField |= 1;			// set bit 0
              if (msg.errorNumber == GRSP.InvalidParameterIndex) {
                comment += ' - CMDERR Invalid Event received'
                msgBitField |= 2;			// set bit 1
              } else {
                var commentCMDERR = ' - CMDERR: expected '+ GRSP.InvalidParameterIndex + ' received ' + msg.errorNumber
                winston.info({message: 'VLCB:      FAIL' + commentCMDERR});
                comment += commentCMDERR
              }
            }
            if (msg.mnemonic == "GRSP"){
              msgBitField |= 4;			// set bit 2
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.InvalidParameterIndex){
                  comment += ' - GRSP Invalid Event received'
                  msgBitField |= 8;			// set bit 3
                } else {
                  var commentGRSP1 = ' - GRSP: expected result ' + GRSP.InvalidParameterIndex + ' but received ' + msg.result;
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
            if (msg.mnemonic == "PARAN"){
              winston.info({message: 'VLCB:      unexpected PARAN response for index ' + parameterIndex}); 
            }
          }
        });
        if (msgBitField == 15) {
          comment += ' -  CMDERR & GRSP messages has been received correctly'
          this.hasTestPassed = true;
        }
        // check for missing messages
        if ((msgBitField & 1) == 0){ comment +=' - CMDERR message missing', this.hasTestPassed = false }
        if ((msgBitField & 2) == 0){ comment += ' - GRSP message missing', this.hasTestPassed = false }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNPN_INVALID_INDEX (0x73)', comment);
        resolve(this.hasTestPassed);
      ;} , this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            if (msg.mnemonic == "GRSP"){
              if (msg.result == GRSP.Invalid_Command) {
                this.hasTestPassed = true;
                comment = ' - GRSP Invalid Command received correctly'
              } else {
                comment = 'GRSP wrong result number - expected ' + GRSP.Invalid_Command + ' received ' + msg.result
                winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.Invalid_Command}); 
              }
            }
            if (msg.mnemonic == "PARAN"){
              winston.info({message: 'VLCB:      RQNPN_SHORT: unexpected PARAN response for index ' + parameterIndex}); 
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNPN_SHORT (0x73)', comment);
        resolve(this.hasTestPassed);
      ;} , this.defaultTimeout );
    }.bind(this));
  }
 
    
	// 0x75 - CANID
  test_CANID(RetrievedValues, CANID) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN CANID test: node ' + RetrievedValues.getNodeNumber() + ' CANID ' + CANID});
      this.hasTestPassed = false;
      var msgBitField = 0;	// bit field to capture when each message has been received
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeCANID(RetrievedValues.getNodeNumber(), CANID);
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            // ignore if node number doesn't match
            if (msg.mnemonic == "WRACK"){
              msgBitField |= 1;   // set bit 0
            }
            if (msg.mnemonic == "GRSP"){
              msgBitField |= 2;			// set bit 1
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.OK){
                  comment += ' - GRSP Invalid Event received'
                  msgBitField |= 4;			// set bit 2
                } else {
                  var commentGRSP1 = ' - GRSP: expected result ' + GRSP.OK + ' but received ' + msg.result;
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
        if (msgBitField == 7) {
          comment =  ' - both WRACK and GRSP messages have been received correctly'
          this.hasTestPassed = true;
        }
        // check for missing messages
        if ((msgBitField & 1) == 0){ comment += '- WRACK messages missing'}
        if ((msgBitField & 2) == 0){ comment += ' - GRSP message missing'}
        utils.processResult(RetrievedValues, this.hasTestPassed, 'CANID (0x75)', comment);
        resolve(this.hasTestPassed);
      }, this.defaultTimeout );
    }.bind(this));
  }
	
	
	// 0x75 - CANID
  test_CANID_INVALID_VALUE(RetrievedValues, CANID) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN CANID_INVALID_VALUE test: node ' + RetrievedValues.getNodeNumber() + ' CANID ' + CANID});
      this.hasTestPassed = false;
      var msgBitField = 0;	// bit field to capture when each message has been received
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeCANID(RetrievedValues.getNodeNumber(), CANID);
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.mnemonic == "CMDERR"){
            if (msg.errorNumber == GRSP.InvalidEvent) {
              msgBitField |= 1;			// set bit 0
            } else {
              winston.info({message: 'VLCB:      CMDERR wrong error number - expected ' + GRSP.InvalidEvent}); 
            }
          }
          if (msg.mnemonic == "GRSP"){
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.Invalid_parameter){
                  msgBitField |= 2;   // set bit 1
                } else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.Invalid_parameter}); 
                }
              }
            }
          }
        });
        if (msgBitField == 3) {
          // both messages has been received
          this.hasTestPassed = true;
        } else {
          if (msgBitField == 0){ winston.info({message: 'VLCB:      Fail: Both CMDERR & GRSP messages missing/incorrect'}); }
          if (msgBitField == 1){ winston.info({message: 'VLCB:      Fail: GRSP message missing/incorrect'}); }
          if (msgBitField == 2){ winston.info({message: 'VLCB:      Fail: CMDERR message missing/incorrect'}); }
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'CANID_INVALID_VALUE');
        resolve(this.hasTestPassed);
      }, this.defaultTimeout );
    }.bind(this));
  }
	
	
	// 0x75 - CANID
  test_CANID_SHORT(RetrievedValues, CANID) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN CANID_SHORT test: node ' + RetrievedValues.getNodeNumber() + ' CANID ' + CANID});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeCANID(RetrievedValues.getNodeNumber(), CANID);
			// :SB780N75FFFF00;
			// 1234567890123456
			// truncate the 16 byte message to remove the last byte - remove last three characters & add ';' to end
			msgData = msgData.substring(0,13) + ';'
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.mnemonic == "GRSP"){
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.Invalid_Command){
                  this.hasTestPassed = true;
                }
              }
            }
          }
        });
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected GRSP'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'CANID_SHORT');
        resolve(this.hasTestPassed);
      }, this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            // ignore if node numbers don't match
            if (msg.mnemonic == "GRSP"){
              if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
                if (msg.result == GRSP.OK){
                  this.hasTestPassed = true;
                } else {
                  comment += ' - GRSP: expected result ' + GRSP.OK + ' but received ' + msg.result;
                  winston.info({message: 'VLCB:      ' + comment}); 
                }
              }else {
                comment += ' - GRSP: expected requested opcode ' + cbusLib.decode(msgData).opCode
                + ' but received ' + msg.requestOpCode;
                winston.info({message: 'VLCB:      ' + comment}); 
              }
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'MODE (0x76)', comment);  
        resolve(this.hasTestPassed);
      }, this.defaultTimeout );
    }.bind(this));
  }
	
	
	// 0x78 - RQSD
  test_RQSD(RetrievedValues, ServiceIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN RQSD test - node ' + RetrievedValues.getNodeNumber() + ' serviceIndex ' + ServiceIndex});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      if (ServiceIndex == 0) {RetrievedValues.clearAllServices()} // clear stored services if we're reading all of them
      var msgData = cbusLib.encodeRQSD(RetrievedValues.getNodeNumber(), ServiceIndex);
      this.network.write(msgData);
      var comment = ''
      setTimeout(()=>{
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            if (ServiceIndex == 0) {
              // service index is 0, so expecting one or more 'SD' messages
              if (msg.mnemonic == "SD"){
                this.hasTestPassed = true;
                if (msg.ServiceIndex == 0){
                  // special case that SD message with serviceIndex 0 has the service count in ther version field
                  RetrievedValues.data.ServicesReportedCount = msg.ServiceVersion;
                  // also assume to start with that this defines the maximum service index
                  RetrievedValues.data.MaxServiceIndex = msg.ServiceVersion
                  this.hasTestPassed = true;	// accept test has passed if we get this one message
                  winston.info({message: 'VLCB:      Service Discovery : Service count ' + msg.ServiceVersion });
                } else {
                  RetrievedValues.addService(msg.ServiceIndex, msg.ServiceType, msg.ServiceVersion);
                  winston.info({message: 'VLCB:      Service Discovery : Service found: index ' + msg.ServiceIndex 
                              +  ' - ' + RetrievedValues.data.Services[msg.ServiceIndex.toString()].ServiceName});
                }
              }
            } else {
              // Service Index is non-zero, so expecting a single 'ESD' message for the service specified
              // setup comment for failed case
              comment = ' - missing expected ESD message'
              if (msg.mnemonic == "ESD"){
                this.hasTestPassed = true;
                comment = ' - ESD received'
                RetrievedValues.addServiceData(msg.ServiceIndex, msg.Data1, msg.Data2, msg.Data3, msg.Data4);
              }
            }
          }
        });
        //
        // we can check we received SD messages for all the expected services if the requested serviceIndex was 0
        if (ServiceIndex == 0) {
          if (RetrievedValues.data.ServicesActualCount != RetrievedValues.data.ServicesReportedCount) {
              winston.info({message: 'VLCB:      RQSD failed - service count doesn\'t match'});
              comment = 'Service count reported: ' + RetrievedValues.data.ServicesReportedCount + ' actual services received: ' + RetrievedValues.data.ServicesActualCount
              this.hasTestPassed = false;
          } else {
            comment = ' - Service count reported matches actual count of received services'
          }
        }
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - no response to RQSD received'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQSD (0x78)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        var msg_count = 0;	// we may want to compare the number of messages,so lets start a count
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            // expecting a GRSP message
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
            if (msg.mnemonic == "ESD"){
              this.hasTestPassed = false;
              RetrievedValues.addServiceData(msg.ServiceIndex, msg.Data1, msg.Data2, msg.Data3, msg.Data4);
              winston.info({message: 'VLCB:      RQSD_INVALID_SERVICE : unexpected ESD message'});
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQSD_INVALID_SERVICE (0x78)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
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
      var comment = ''
      setTimeout(()=>{
        var msg_count = 0;	// we may want to compare the number of messages,so lets start a count
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            // expecting a GRSP message
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
            if (msg.mnemonic == "ESD"){
              this.hasTestPassed = false;
              RetrievedValues.addServiceData(msg.ServiceIndex, msg.Data1, msg.Data2, msg.Data3, msg.Data4);
              winston.info({message: 'VLCB:      unexpected ESD message'});
            }
          }
        });
        if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQSD_SHORT (0x78)', comment);
        resolve(this.hasTestPassed);
      } , this.defaultTimeout );
    }.bind(this));
  }
    	

} // end class

