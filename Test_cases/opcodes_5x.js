'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared

//
//
//
function decToHex(num, len) {return parseInt(num).toString(16).toUpperCase().padStart(len, '0');}


module.exports = class opcodes_5x {

  constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_5x Constructor'});
		
		this.network = NETWORK;
      this.hasTestPassed = false;
      this.inSetupMode = false;
      this.test_nodeNumber = 0;
   }


	// 0x50 RQNN
	checkForRQNN(RetrievedValues){
    this.inSetupMode = false;
		this.hasTestPassed = false;
    this.network.messagesIn.forEach(msg => {
      if (msg.mnemonic == "RQNN"){
        this.test_nodeNumber = msg.nodeNumber;
        RetrievedValues.setNodeNumber( msg.nodeNumber);
        this.inSetupMode = true;
        this.hasTestPassed = true;
        winston.info({message: 'VLCB:      module ' + this.test_nodeNumber + ' in setup mode '});
        // ok, the message must be from the unit under test, so store it's CANID
        RetrievedValues.data.CANID = parseInt(msg.encoded.substr(3, 2), 16)>>1
      }
    })
		if (this.hasTestPassed){ 
			utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNN');
		}else{
			// in this instance, we're calling this method multiple times until we get an RQNN,
			// so don't mark each try as a fail - the upper layer will timeout and fail if didn't get a pass
			winston.info({message: 'VLCB:      no RQNN received....'});
		}
		winston.debug({message: '-'});
	}


  // 0x53 - NNLRN
  // there is no response specified for this command
  // to check if this succeeded, read node parameter 8, and check bit 5 is set
  async test_NNLRN(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NNLRN test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var comment = ''
    var msgData = cbusLib.encodeNNLRN(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    await utils.sleep(100);    // allow time for command to be processed - can't check this directly

    // to check if it's in learn mode, read node parameter 8
    msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), 8);
    this.network.write(msgData);

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
          if (msg.mnemonic == "PARAN"){
            comment = ' - received PARAN message'
            // ok - we have a returned value, so check bit 5 (0x20) is set (in learn mode)
            if (msg.parameterValue & 0x20) { 
              RetrievedValues.data.inLearnMode = true;
              this.hasTestPassed = true; 
              comment = ' - in learn mode'
            }
          }
        }
      })
      if(this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ comment = ' - missing expected PARAN message'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NNLRN (0x53)', comment);
    return this.hasTestPassed
  }


  // 0x54 - NNULN
  // there is no response specified for this command
  // to check if this succeeded, read node parameter 8, and check bit 5 is clear
  async test_NNULN(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NNULN test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var comment = ''
    var msgData = cbusLib.encodeNNULN(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    await utils.sleep(100);    // allow time for command to be processed - can't check this directly

    // to check if it's no longer in learn mode, read node parameter 8
    msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), 8);
    this.network.write(msgData);

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
          if (msg.mnemonic == "PARAN"){
            // ok - we have a returned value, so check bit 5 (0x20) is clear (in learn mode)
            if (!(msg.parameterValue & 0x20)) { 
              RetrievedValues.data.inLearnMode = false;
              this.hasTestPassed = true; 
              comment = ' - out of learn mode'
            }
          }
        }
      })
      if(this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ comment = ' - missing expected PARAN'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NNULN (0x54)', comment);
    return this.hasTestPassed
  }


  // 0x55 - NNCLR
  async test_NNCLR(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NNCLR test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeNNCLR(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
          if (msg.mnemonic == "WRACK"){
            this.hasTestPassed = true; 
            comment = ' - WRACK received'
          }
        }
      })
      if(this.hasTestPassed){ break; }
    }

    if(!this.hasTestPassed){ comment = ' - missing expected WRACK'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NNCLR (0x55)', comment);
    return this.hasTestPassed
  }


  // 0x56 - NNEVN
  async test_NNEVN(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NNEVN test: node ' + RetrievedValues.getNodeNumber()});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeNNEVN(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
          if (msg.mnemonic == "EVNLF"){
            this.hasTestPassed = true;
            // store the returned value
            RetrievedValues.data["EventSpaceLeft"] = msg.EVSPC;
            comment = ' - EVNLF received'
          }
        }
      })
      if(this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ comment = ' - missing expected EVNLF message'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NNEVN (0x56)', comment);
    return this.hasTestPassed
  }


  // 0x57 - NERD
  // this will also clear the RetrievedValues of events, so that only the ones returned by this operation
  // will then be in RetrivedEvents - we can use it to check if a 'taught' event is now present
  async test_NERD(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NERD test: node ' + RetrievedValues.getNodeNumber()});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeNERD(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    RetrievedValues.clearEvents()
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
          if (msg.mnemonic == "ENRSP"){
            this.hasTestPassed = true;
            comment = ' - received ENRSP'
            // store the returned value
            if (RetrievedValues.data.events[msg.eventIndex] == undefined) { RetrievedValues.data.events[msg.eventIndex] = {}; }
            RetrievedValues.data.events[msg.eventIndex].eventIdentifier = msg.eventIdentifier;
          }
        }
      })
      if(this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ comment = ' - missing expected ENRSP'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NERD (0x57)', comment);
    return this.hasTestPassed
  }


  // 0x58 - RQEVN
  async test_RQEVN(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN RQEVN test: node ' + RetrievedValues.getNodeNumber()});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeRQEVN(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
          if (msg.mnemonic == "NUMEV"){
            this.hasTestPassed = true;
            comment = ' - received NUMEV'
            // store the returned value
            RetrievedValues.data["StoredEventCount"] = msg.eventCount;
          }
        }
      })
      if(this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ comment = ' - missing expected NUMEV'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RQEVN (0x58)', comment);
    return this.hasTestPassed
  }


  // 0x5D - ENUM
  async test_ENUM(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN ENUM test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeENUM(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
          if (msg.mnemonic == "NNACK"){
            this.hasTestPassed = true;
            comment = ' - received NNACK'
          }
        }
      })
      if(this.hasTestPassed){ break; }
    }
    if(!this.hasTestPassed){ comment = ' - missing expected NNACK'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'ENUM (0x5D)', comment);
    return this.hasTestPassed
  }


  // 0x5E - NNRST
  // there is no response specified for this command
  // to check if this succeeded, read MNS diagnostics, and check uptime has been reset
  async test_NNRST(RetrievedValues, serviceIndex) {
    winston.debug({message: 'VLCB: BEGIN NNRST test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var comment = ''
    var msgData = cbusLib.encodeNNRST(RetrievedValues.getNodeNumber());
    this.network.write(msgData);
    await utils.sleep(100);    // allow time for command to be processed - can't check this directly

    if (serviceIndex) {
      // get all diagnostics for MNS service, so we can check uptime has been reset
      winston.debug({message: 'VLCB: NNRST test - getting all MNS diagnostics after NNRST'});
      var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), serviceIndex, 0);
      this.network.write(msgData);

      var startTime = Date.now();
      // set maximum wait as 1 second, unless local unit tests running...
      var timeout = 1000;
      if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
      while(Date.now()-startTime < timeout) {
        await utils.sleep(10);
        var MSB_Uptime 
        var LSB_Uptime 
        this.network.messagesIn.forEach(msg => {
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            if (msg.mnemonic == "DGN"){
              if (msg.DiagnosticCode == 2) {
                MSB_Uptime = msg.DiagnosticValue
                winston.debug({message: 'VLCB:      NNRST: ' + ' uptime MSB ' + MSB_Uptime}); 
              }
              if (msg.DiagnosticCode == 3) {
                LSB_Uptime = msg.DiagnosticValue
                winston.debug({message: 'VLCB:      NNRST: ' + ' uptime LSB ' + LSB_Uptime}); 
              }
            }
          }
        })
        // now check uptime if we've received both parts
        if ((MSB_Uptime != undefined) && (LSB_Uptime != undefined)) {
          var uptime = (MSB_Uptime << 8) + LSB_Uptime
          winston.info({message: 'VLCB:      NNRST: ' + ' uptime after NNRST = ' + uptime}); 
          if (uptime < 2){ 
            this.hasTestPassed = true 
            comment = ' - uptime is less than 2'
          } else {
            comment = ' - uptime is ' + uptime + ', but expected < 2'
          }
        } else {
          comment = ' -  uptime after NNRST has undefined value'
        }
        if(this.hasTestPassed){ break; }
      }
    } else {
      comment = ' - No Service 1 found'
      winston.info({message: 'VLCB:      No Service 1 found '}); 
    }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'NNRST (0x5E)', comment);
    return this.hasTestPassed
  }


} // end class

