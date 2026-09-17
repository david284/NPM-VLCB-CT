'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');


	// get_AllNodeParameters
  exports.get_AllNodeParameters =  async function get_AllNodeParameters(connection, RetrievedValues) {
    winston.debug({message: 'VLCB: Get all Parameters '});
    this.hasTestPassed = false;
    connection.messagesIn = [];
    var msgData = cbusLib.encodeRQNPN(RetrievedValues.getNodeNumber(), 0);
    connection.write(msgData);
    var comment = ''
    
    // Index 0 is a special case
    // It returns the total number or parameters (not including itself)
    // and in VLCB, it's followed by a message for each individual parameter

    var timeout = 1000
    var startTime = Date.now();
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
    }
    // need to reset actual count as we increment it
    RetrievedValues.data.nodeParameters.actualCount = 0
    connection.messagesIn.forEach(msg => {
      winston.debug({message: 'VLCB: Get Param ' + JSON.stringify(msg)});
      if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
        if (msg.mnemonic == "PARAN"){
          if (msg.parameterIndex == 0) { 
            RetrievedValues.data.nodeParameters.advertisedCount = msg.parameterValue
          } else {
            RetrievedValues.data.nodeParameters.actualCount++   // only count non-zero indexes
          }
          // new value, so save it
          RetrievedValues.addNodeParameter(msg.parameterIndex, msg.parameterValue);
        }
      }
    })
    return
  }
