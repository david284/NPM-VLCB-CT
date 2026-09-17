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
  }


  // 0x71 - NVRD
  // complex testing conditions, as requesting node variable index 0 should return all node variables & the count
  // whereas requesting a non zero node variable index should just return that one node variable
  //
  async test_NVRD(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
    winston.debug({message: 'VLCB: BEGIN NVRD test - serviceIndex ' + ServiceIndex + ' nodeVariableIndex ' + NodeVariableIndex});
    this.hasTestPassed = false;
    var comment = ''
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeNVRD(RetrievedValues.getNodeNumber(), NodeVariableIndex);
    this.network.write(msgData);

    var countNV = 0;    // count the NV's received
    var startTime = Date.now();
    // set maximum wait as 2 seconds, unless local unit tests running...
    var timeout = 5000;     // allow enough for multiple responses - will exit if completes early
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      countNV = 0;      // reset the NV count for each pass. to avoid duplicating
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
          if (msg.mnemonic == "NVANS"){
            comment = ' - received NVANS message'
            if (msg.nodeVariableIndex >0) countNV++   // only count if non-zero (NV 0 isn't counted)
            winston.debug({message: 'VLCB: received NVANS message ' + countNV});
            RetrievedValues.data.nodeVariables[msg.nodeVariableIndex] = msg.nodeVariableValue;
            if (NodeVariableIndex > 0) {
              // if requested NV is not 0, only expecting one response, so it's passed if we get here
              this.hasTestPassed = true;
            } else {
              // NodeVariableIndex 0 should have had the number of NV's (not including it's self)
              if (countNV == RetrievedValues.data.nodeVariables[0]){
                this.hasTestPassed = true;
              }
            }
          }
        }
      });
      if(this.hasTestPassed){ break; }
    }
    //
    // now if requested NV = 0 (all NV's) there are several failure conditions
    // so check number of NV's received against expected counts
    if (NodeVariableIndex == 0){
      if (countNV != RetrievedValues.data.nodeVariables[0]){
        this.hasTestPassed = false
        comment = " - NV's received doesn't match NV0"
      }
      if (countNV != RetrievedValues.data.nodeParameters[6].value){
          this.hasTestPassed = false
          comment = " - NV's received (" + countNV + ") doesn't match Node Parameter 6 (" + RetrievedValues.data.nodeParameters[6].value + ")"
      }
    } else {
      // if requested NV is not 0, then only expecting one response, and didn't get one
      if(!this.hasTestPassed){ comment = ' - expected NVANS message'; }
    }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD (0x71)', comment);
    return this.hasTestPassed
  }

	
  // 0x71 - NVRD
	// request a node variable index that doesn't exist, should get a CMDERR & GRSP back
  async test_NVRD_INVALID_INDEX(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
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

      var startTime = Date.now();
      // set maximum wait as 1 second, unless local unit tests running...
      var timeout = 1000
      if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
      while(Date.now()-startTime < timeout) {
        await utils.sleep(10);
          this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            if (msg.mnemonic == "CMDERR"){
                msgBitField |= 1;			// set bit 0
              if (msg.errorNumber == GRSP.InvalidNodeVariableIndex) {
                comment += ' - CMDERR Invalid Node Variable Index received'
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
                  comment += ' - GRSP Invalid Node Variable Index received'
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
        if (msgBitField == 15) { this.hasTestPassed = true; }
        if (this.hasTestPassed){ break; }
      }
      if ((msgBitField & 1) == 0){ comment +=' - CMDERR message missing'; }
      if ((msgBitField & 4) == 0){ comment += ' - GRSP message missing'; }
      utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD_INVALID_INDEX (0x71)', comment); 
    } else {
      winston.info({message: 'VLCB: **** NVRD_INVALID_INDEX Test Aborted **** Node Variable Index 0 requested'});				
    }
    return this.hasTestPassed
  }
	
	
  // 0x71 - NVRD_SHORT
	// message is short, missing the Node Variable - GRSP expected
	async test_NVRD_SHORT(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
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

      var startTime = Date.now();
      // set maximum wait as 1 second, unless local unit tests running...
      var timeout = 1000
      if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
      while(Date.now()-startTime < timeout) {
        await utils.sleep(10);
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
        if (this.hasTestPassed){ break; }
      }
      if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
      utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD_SHORT (0x71)', comment);
    } else {
      winston.info({message: 'VLCB: **** NVRD_SHORT Test Aborted **** Node Variable Index 0 requested'});				
    }
    return this.hasTestPassed
  }




	// 0x73 - RQNPN
  async test_RQNPN(RetrievedValues, module_descriptor, requestedParameterIndex) {
    winston.debug({message: 'VLCB: Get Param ' + requestedParameterIndex});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), requestedParameterIndex);
    this.network.write(msgData);
    var comment = ''
    
    // Index 0 is a special case
    // It returns the total number or parameters (not including itself)
    // and in VLCB, it's followed by a message for each individual parameter
    // so treat index 0 as a special case

    if (requestedParameterIndex == 0){
      // set default timout as 1 second
      var timeout = 1000
      if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout if local unit tests
      var startTime = Date.now();
      winston.debug({message: 'VLCB: Get Param ' + JSON.stringify(startTime)});
      while(Date.now()-startTime < timeout) {
        await utils.sleep(10);
      }
      winston.debug({message: 'VLCB: Get Param ' + JSON.stringify(startTime)});
      // need to reset actual count as we increment it
      RetrievedValues.data.nodeParameters.actualCount = 0
      this.network.messagesIn.forEach(msg => {
        winston.debug({message: 'VLCB: Get Param ' + JSON.stringify(msg)});
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
          if (msg.mnemonic == "PARAN"){
            if (msg.parameterIndex == 0) { 
              RetrievedValues.data.nodeParameters.advertisedCount = msg.parameterValue
            } else {
              RetrievedValues.data.nodeParameters.actualCount++   // only count non-zero indexes
            }
            // ok - we have a value, so assume the test has passed - now do additional consistency tests
            // and fail the test if any of these tests fail
            this.hasTestPassed = true;					
            comment += this.checkPARAN(RetrievedValues, module_descriptor, msg)
          }
        }
      })
      if (RetrievedValues.data.nodeParameters.actualCount != RetrievedValues.data.nodeParameters.advertisedCount){
        this.hasTestPassed = false;	
        comment += "- parameters expected: " + RetrievedValues.data.nodeParameters.advertisedCount + " received: " + RetrievedValues.data.nodeParameters.actualCount			
      }
      winston.info({message: 'VLCB: RQNPN 0: actual count: ' + RetrievedValues.data.nodeParameters.actualCount + ' advertised count: ' + RetrievedValues.data.nodeParameters.advertisedCount})
    } else {
      // set default timout as 1 second
      var timeout = 1000
      if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout if local unit tests
      var startTime = Date.now();
      while(Date.now()-startTime < timeout) {
        await utils.sleep(10);
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
            if (msg.mnemonic == "PARAN"){
              // ok - we have a value, so assume the test has passed - now do additional consistency tests
              // and fail the test if any of these tests fail
              this.hasTestPassed = true;					
              comment += this.checkPARAN(RetrievedValues, module_descriptor, msg)
            }
          }
        })
        if (requestedParameterIndex > 0){
          // don't break out early if all parameters requested
          if (this.hasTestPassed){ break; }
        }
      }
    }

    // lets display what we have
    this.network.messagesIn.forEach(msg => {
      if(msg.nodeNumber == RetrievedValues.getNodeNumber()) {
        if (msg.mnemonic == "PARAN"){
          winston.info({message: 'VLCB:      Node Parameter ' + msg.parameterIndex + ' '
          + RetrievedValues.getNodeParameterName(msg.parameterIndex)
            + ': ' + msg.parameterValue});
        }
      }
    })

    if(!this.hasTestPassed){
      if (comment == '') {comment = ' - missing expected PARAN message'; } 
    } else {
      comment = '' // test passed, no comment
    }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNPN (0x73)', comment);
    return this.hasTestPassed
  }

  checkPARAN(RetrievedValues, module_descriptor, msg){
    var comment = ""
    if (RetrievedValues.data["nodeParameters"][msg.parameterIndex] != null){
      // we have previously read this value, so check it's still the same
      if ( RetrievedValues.data["nodeParameters"][msg.parameterIndex].value != msg.parameterValue){
        this.hasTestPassed = false;
        comment += ' retrieved value: ' + RetrievedValues.data["nodeParameters"][msg.parameterIndex].value
        winston.debug({message: 'VLCB:      Failed Node - RetrievedValues value mismatch' + comment});  
      }
    } else {
      // new value, so save it
      RetrievedValues.addNodeParameter(msg.parameterIndex, msg.parameterValue);
      winston.debug({message: 'VLCB:      Node Parameter ' + msg.parameterIndex + ' added to retrieved_values'});
    }
    // if it's in the module_descriptor, we need to check we've read the same value
    if (module_descriptor.nodeParameters[msg.parameterIndex] != null) {
      if (module_descriptor.nodeParameters[msg.parameterIndex].value != null) {
        if ( module_descriptor.nodeParameters[msg.parameterIndex].value != msg.parameterValue) {
          this.hasTestPassed = false;
          comment += ' module descriptor value: ' + module_descriptor.nodeParameters[msg.parameterIndex].value
          winston.debug({message: 'VLCB:      Failed module descriptor mismatch' + comment});
        }
      } else {
        winston.debug({message: 'VLCB: :: info: No matching module_descriptor value entry'});
      }
    } else {
      winston.debug({message: 'VLCB: :: info: No matching module_descriptor file entry'});
    }
    return comment
  }  



    
	// 0x73 - RQNPN - out of bounds test
  async test_RQNPN_INVALID_INDEX(RetrievedValues, module_descriptor, parameterIndex) {
    winston.debug({message: 'VLCB: Get Param ' + parameterIndex});
    this.hasTestPassed = false;
    var msgBitField = 0;	// bit field to capture when each message has been received
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), parameterIndex);
    this.network.write(msgData);
    var comment = ''

    // set wait as 500mS, unless local unit tests running...
    var timeout = 500
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    await utils.sleep(timeout);
    this.network.messagesIn.forEach(msg => {
      if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
        if (msg.mnemonic == "CMDERR"){
          msgBitField |= 1;			// set bit 0
          if (msg.errorNumber == GRSP.InvalidParameterIndex) {
            comment += ' - CMDERR Invalid Parameter Index received'
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
              comment += ' - GRSP Invalid Parameter Index received'
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
    if (msgBitField == 15) { this.hasTestPassed = true; }
    // check for missing messages
    if ((msgBitField & 1) == 0){ comment +=' - CMDERR message missing' }
    if ((msgBitField & 4) == 0){ comment += ' - GRSP message missing' }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNPN_INVALID_INDEX (0x73)', comment);
    return this.hasTestPassed
  }
 
    
	// 0x73 - RQNPN_SHORT - short message
  async test_RQNPN_SHORT(RetrievedValues, module_descriptor, parameterIndex) {
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

    // set maximum wait as 500mS, unless local unit tests running...
    var timeout = 500
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    await utils.sleep(timeout);
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
    return this.hasTestPassed
  }
 
    
	// 0x75 - CANID
  async test_CANID(RetrievedValues, CANID) {
    winston.debug({message: 'VLCB: BEGIN CANID test: node ' + RetrievedValues.getNodeNumber() + ' CANID ' + CANID});
    this.hasTestPassed = false;
    var msgBitField = 0;	// bit field to capture when each message has been received
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeCANID(RetrievedValues.getNodeNumber(), CANID);
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
        this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
          // ignore if node number doesn't match
          if (msg.mnemonic == "WRACK"){
            comment += ' - WRACK received'
            msgBitField |= 1;   // set bit 0
          }
          if (msg.mnemonic == "GRSP"){
            msgBitField |= 2;			// set bit 1
            if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
              if (msg.result == GRSP.OK){
                comment += ' - GRSP OK received'
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
      if (msgBitField == 7) { this.hasTestPassed = true; }
      if (this.hasTestPassed){ break; }
    }
    // check for missing messages
    if ((msgBitField & 1) == 0){ comment += '- WRACK messages missing'}
    if ((msgBitField & 2) == 0){ comment += ' - GRSP message missing'}
    utils.processResult(RetrievedValues, this.hasTestPassed, 'CANID (0x75)', comment);
    return this.hasTestPassed
  }
	
	
	// 0x75 - CANID_INVALID_VALUE
  async test_CANID_INVALID_VALUE(RetrievedValues, CANID) {
    winston.debug({message: 'VLCB: BEGIN CANID_INVALID_VALUE test: node ' + RetrievedValues.getNodeNumber() + ' CANID ' + CANID});
    this.hasTestPassed = false;
    var msgBitField = 0;	// bit field to capture when each message has been received
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeCANID(RetrievedValues.getNodeNumber(), CANID);
    this.network.write(msgData);

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (msgBitField == 3) { this.hasTestPassed = true; }
      if (this.hasTestPassed){ break; }
    }
    if (msgBitField == 0){ winston.info({message: 'VLCB:      Fail: Both CMDERR & GRSP messages missing/incorrect'}); }
    if (msgBitField == 1){ winston.info({message: 'VLCB:      Fail: GRSP message missing/incorrect'}); }
    if (msgBitField == 2){ winston.info({message: 'VLCB:      Fail: CMDERR message missing/incorrect'}); }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'CANID_INVALID_VALUE');
    return this.hasTestPassed
  }
	
	
	// 0x75 - CANID
  async test_CANID_SHORT(RetrievedValues, CANID) {
    winston.debug({message: 'VLCB: BEGIN CANID_SHORT test: node ' + RetrievedValues.getNodeNumber() + ' CANID ' + CANID});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeCANID(RetrievedValues.getNodeNumber(), CANID);
    // :SB780N75FFFF00;
    // 1234567890123456
    // truncate the 16 byte message to remove the last byte - remove last three characters & add ';' to end
    msgData = msgData.substring(0,13) + ';'
    this.network.write(msgData);

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected GRSP'}); }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'CANID_SHORT');
    return this.hasTestPassed
  }


  // 0x76 - MODE
  async test_MODE(RetrievedValues, MODE) {
    winston.debug({message: 'VLCB: BEGIN MODE test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeMODE(RetrievedValues.getNodeNumber(), MODE);
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'MODE (0x76)', comment);  
    return this.hasTestPassed
  }
	
	
	// 0x78 - RQSD
  async test_RQSD(RetrievedValues, requestedServiceIndex) {
    winston.debug({message: 'VLCB: BEGIN RQSD test - node ' + RetrievedValues.getNodeNumber() + ' serviceIndex ' + requestedServiceIndex});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    if (requestedServiceIndex == 0) {RetrievedValues.clearAllServices()} // clear stored services if we're reading all of them
    var msgData = cbusLib.encodeRQSD(RetrievedValues.getNodeNumber(), requestedServiceIndex);
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 2 seconds, unless local unit tests running...
    var timeout = 2000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
          if (requestedServiceIndex == 0) {
            // service index is 0, so expecting one or more 'SD' messages
            if (msg.mnemonic == "SD"){
              if (msg.ServiceIndex == 0){
                // special case that SD message with serviceIndex 0 has the service count in ther version field
                RetrievedValues.data.ServicesReportedCount = msg.ServiceVersion;
                // also assume to start with that this defines the maximum service index
                RetrievedValues.data.MaxServiceIndex = msg.ServiceVersion
                this.hasTestPassed = true;	// accept test has passed if we get this one message
              } else {
                RetrievedValues.addService(msg.ServiceIndex, msg.ServiceType, msg.ServiceVersion);
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
      if (requestedServiceIndex == 0) {
        if (RetrievedValues.data.ServicesActualCount != RetrievedValues.data.ServicesReportedCount) {
            comment = 'Service count reported: ' + RetrievedValues.data.ServicesReportedCount + ' actual services received: ' + RetrievedValues.data.ServicesActualCount
            this.hasTestPassed = false;
        } else if (RetrievedValues.data.ServicesReportedCount == 0) {
          comment = ' - No services reported'
          this.hasTestPassed = false;
        } else {
          comment = ' - Service count reported matches actual count of received services'
          this.hasTestPassed = true;
        }
      }
      if (this.hasTestPassed){ break; }
    }
    // print out each service received
    this.network.messagesIn.forEach(msg => {
      if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
        if (msg.mnemonic == "SD"){
          if (msg.ServiceIndex == 0){
            winston.info({message: 'VLCB:      Service Discovery : Service count ' + msg.ServiceVersion });
          } else {
            // winston.info({message: 'VLCB:      Service Discovery : Service found: index ' + msg.ServiceIndex });
            winston.info({message: 'VLCB:      Service Discovery : Service found: index ' + msg.ServiceIndex 
            +  ' - ' + RetrievedValues.data.Services[msg.ServiceIndex.toString()].ServiceName});
          }  
        }
      }
    });

    if(!this.hasTestPassed){ if (comment == '') {comment = ' - no response to RQSD received'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RQSD (0x78)', comment);
    return this.hasTestPassed
  }
    
	
	// 0x78 - RQSD_INVALID_SERVICE - service index out of bounds test
  async test_RQSD_INVALID_SERVICE(RetrievedValues, ServiceIndex) {
    winston.debug({message: 'VLCB: BEGIN RQSD_INVALID_SERVICE test - serviceIndex ' + ServiceIndex});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeRQSD(RetrievedValues.getNodeNumber(), ServiceIndex);
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RQSD_INVALID_SERVICE (0x78)', comment);
    return this.hasTestPassed
  }
    	

	// 0x78 RQSD_SHORT - short message
  async test_RQSD_SHORT(RetrievedValues, ServiceIndex) {
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

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
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
      if (this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ if (comment == '') {comment = ' - missing expected GRSP'; } }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RQSD_SHORT (0x78)', comment);
    return this.hasTestPassed
  }
    	

} // end class

