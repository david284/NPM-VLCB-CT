'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbusLibrary');
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


class opcodes_5x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_5x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.inSetupMode = false;
        this.test_nodeNumber = 0;
        this.response_time = 100;
    }


	// 0x50 RQNN
	checkForRQNN(RetrievedValues){
		this.hasTestPassed = false;
    if (this.network.messagesIn.length > 0){
      this.network.messagesIn.forEach(element => {
        var msg = cbusLib.decode(element);
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
		}
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
  test_NNLRN(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NNLRN test'});
    return new Promise(function (resolve, reject) {
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeNNLRN(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      setTimeout(()=>{
        // to check if it's in learn mode, read node parameter 8
        msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), 8);
        this.network.write(msgData);
        setTimeout(()=>{
          if (this.network.messagesIn.length > 0){
            this.network.messagesIn.forEach(element => {
              var msg = cbusLib.decode(element);
              if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
                if (msg.mnemonic == "PARAN"){
                  // ok - we have a returned value, so check bit 5 (0x20) is set (in learn mode)
                  if (msg.parameterValue & 0x20) { 
                    RetrievedValues.data.inLearnMode = true;
                    this.hasTestPassed = true; 
                  }
                }
              }
            })
          }
          if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected PARAN'}); }
          utils.processResult(RetrievedValues, this.hasTestPassed, 'NNLRN');
          resolve();
        }, 250 );
      }, 250 );
    }.bind(this));
  }


  // 0x54 - NNULN
  test_NNULN(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NNULN test'});
    return new Promise(function (resolve, reject) {
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeNNULN(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      setTimeout(()=>{
        // to check if it's no longer in learn mode, read node parameter 8
        msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), 8);
        this.network.write(msgData);
        setTimeout(()=>{
          if (this.network.messagesIn.length > 0){
            this.network.messagesIn.forEach(element => {
              var msg = cbusLib.decode(element);
              if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
                if (msg.mnemonic == "PARAN"){
                  // ok - we have a returned value, so check bit 5 (0x20) is clear (in learn mode)
                  if (!(msg.parameterValue & 0x20)) { 
                    RetrievedValues.data.inLearnMode = false;
                    this.hasTestPassed = true; 
                  }
                }
              }
            })
          }
          if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected PARAN'}); }
          utils.processResult(RetrievedValues, this.hasTestPassed, 'NNULN');
          resolve();
        }, 250 );
      } , 250 );
    }.bind(this));
  }


  // 0x54 - NNCLR
  test_NNCLR(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NNCLR test'});
    return new Promise(function (resolve, reject) {
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeNNCLR(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      setTimeout(()=>{
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
              if (msg.mnemonic == "WRACK"){
                this.hasTestPassed = true; 
              }
            }
          })
        }
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected WRACK'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NNCLR');
        resolve();
      } , 250 );
    }.bind(this));
  }


  // 0x56 - NNEVN
  test_NNEVN(RetrievedValues, ServiceIndex) {
    winston.debug({message: 'VLCB: BEGIN NNEVN test'});
    return new Promise(function (resolve, reject) {
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeNNEVN(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(element => {
          var msg = cbusLib.decode(element);
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            if (msg.mnemonic == "EVNLF"){
              this.hasTestPassed = true;
              // store the returned value
              RetrievedValues.data.Services[ServiceIndex]["EventSpaceLeft"] = msg.EVSPC;
            }
          }
        })
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected EVNLF'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NNEVN');
        resolve();
      } , 250 );
    }.bind(this));
  }


  // 0x57 - NERD
  test_NERD(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN NERD test'});
    return new Promise(function (resolve, reject) {
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeNERD(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(element => {
          var msg = cbusLib.decode(element);
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            if (msg.mnemonic == "ENRSP"){
              this.hasTestPassed = true;
              // store the returned value
              if (RetrievedValues.data.events[msg.eventIndex] == undefined) { RetrievedValues.data.events[msg.eventIndex] = {}; }
              RetrievedValues.data.events[msg.eventIndex].eventIdentifier = msg.eventIdentifier;
            }
          }
        })
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected ENRSP'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'NERD');
        resolve();
      } , 250 );
    }.bind(this));
  }


  // 0x58 - RQEVN
  test_RQEVN(RetrievedValues, ServiceIndex) {
    winston.debug({message: 'VLCB: BEGIN RQEVN test'});
    return new Promise(function (resolve, reject) {
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeRQEVN(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(element => {
          var msg = cbusLib.decode(element);
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            if (msg.mnemonic == "NUMEV"){
              this.hasTestPassed = true;
              // store the returned value
              RetrievedValues.data.Services[ServiceIndex]["StoredEventCount"] = msg.eventCount;
            }
          }
        })
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected NUMEV'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQEVN');
        resolve();
      } , 250 );
    }.bind(this));
  }


  // 0x5D - ENUM
  test_ENUM(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN ENUM test'});
    return new Promise(function (resolve, reject) {
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeENUM(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      setTimeout(()=>{
        this.network.messagesIn.forEach(element => {
          var msg = cbusLib.decode(element);
          if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
            if (msg.mnemonic == "NNACK"){
              this.hasTestPassed = true;
            }
          }
        })
        if(!this.hasTestPassed){ winston.info({message: 'VLCB:      FAIL - missing expected NNACK'}); }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'ENUM');
        resolve();
      } , 250 );
    }.bind(this));
  }


  // 0x5E - NNRST
  test_NNRST(RetrievedValues, serviceIndex) {
    winston.debug({message: 'VLCB: BEGIN NNRST test'});
    return new Promise(function (resolve, reject) {
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeNNRST(RetrievedValues.getNodeNumber());
      this.network.write(msgData);
      setTimeout(()=>{
        if (serviceIndex) {
          // get all diagnostics for MNS service, so we can check uptime has been reset
          winston.debug({message: 'VLCB: NNRST test - getting all MNS diagnostics after NNRST'});
          var msgData = cbusLib.encodeRDGN(RetrievedValues.getNodeNumber(), serviceIndex, 0);
          this.network.write(msgData);
          setTimeout(()=>{
            var MSB_Uptime 
            var LSB_Uptime 
            if (this.network.messagesIn.length > 0){
             this.network.messagesIn.forEach(element => {
                var msg = cbusLib.decode(element);
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
            }
            // now check uptime if we've received both parts
            if ((MSB_Uptime != undefined) && (LSB_Uptime != undefined)) {
              var uptime = (MSB_Uptime << 8) + LSB_Uptime
              winston.info({message: 'VLCB:      NNRST: ' + ' uptime after NNRST = ' + uptime}); 
              if (uptime < 2){ this.hasTestPassed = true }
            } else {
              winston.info({message: 'VLCB:      NNRST: ' + ' uptime after NNRST has undefined value '}); 
            }
            utils.processResult(RetrievedValues, this.hasTestPassed, 'NNRST');
            resolve();
          } , 1000 );
        } else {
            winston.info({message: 'VLCB:      No Service 1 found '}); 
        }
      } , 200 );
    }.bind(this));
  }


}

module.exports = {
    opcodes_5x: opcodes_5x
}