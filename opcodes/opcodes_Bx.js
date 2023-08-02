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


class opcodes_Bx {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_Bx Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
    }


	// 0xB2 - REQEV
  // Format: [<MjPri><MinPri=3><CANID>]<B2><NN hi><NN lo><EN hi><EN lo><EV# >
  test_REQEV(RetrievedValues, eventIdentifier, eventVariableIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN REQEV test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      var msgData = cbusLib.encodeREQEV(eventNodeNumber, eventNumber, eventVariableIndex);
      this.network.write(msgData);
      setTimeout(()=>{
        var nonMatchingCount = 0;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if (msg.mnemonic == "EVANS"){
              if ((msg.nodeNumber == eventNodeNumber) && (msg.eventNumber == eventNumber) && (msg.eventVariableIndex == eventVariableIndex)){
                this.hasTestPassed = true; 
                // now store the value
                RetrievedValues.storeEventVariableValue(eventIdentifier, eventVariableIndex, msg.eventVariableValue)
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'REQEV');
        resolve();
      } , 250 );
    }.bind(this));
	} // end Test_EVLRN


	// 0xB2 - REQEV
  // Format: [<MjPri><MinPri=3><CANID>]<B2><NN hi><NN lo><EN hi><EN lo><EV# >
  test_REQEV_SHORT(RetrievedValues, eventIdentifier, eventVariableIndex) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN REQEV_SHORT test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      // now create message and start test
      var eventNodeNumber = parseInt(eventIdentifier.substr(0, 4), 16);
      var eventNumber = parseInt(eventIdentifier.substr(4, 4), 16);
      var msgData = cbusLib.encodeREQEV(eventNodeNumber, eventNumber, eventVariableIndex);
			// :SB780NB200000001FF;
			// 12345678901234567890
			// truncate the 20 byte message to remove the last byte - remove last three bytes & add ';' to end
			msgData = msgData.substring(0,17) + ';'
      this.network.write(msgData);
      setTimeout(()=>{
        var nonMatchingCount = 0;
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            if (msg.nodeNumber == RetrievedValues.getNodeNumber()) {
              // ok - it's the right node
              if (msg.mnemonic == "GRSP"){
                if (msg.result == GRSP.Invalid_Command) {
                  this.hasTestPassed = true;
                } else {
                  winston.info({message: 'VLCB:      GRSP wrong result number - expected ' + GRSP.Invalid_Command}); 
                }
              }
            }
          });
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'REQEV_SHORT');
        resolve();
      } , 250 );
    }.bind(this));
	} // end Test_REQEV_SHORT




} // end class

module.exports = {
    opcodes_Bx: opcodes_Bx
}