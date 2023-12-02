'use strict';
const winston = require('winston');   // use config from root instance
const cbusLib = require('cbuslibrary');
const NodeParameterNames = require('./../Definitions/Text_NodeParameterNames.js');
const utils = require('./../utilities.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


module.exports = class opcodes_1x {

  constructor(NETWORK) {
    //                        0123456789012345678901234567890123456789
    winston.debug({message:  '----------------- opcodes_1x Constructor'});
    
    this.network = NETWORK;
    this.hasTestPassed = false;
  }
  
  
  // 10 - RQNP
  async test_RQNP(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN RQNP test'});
    RetrievedValues.data["nodeParameters"] = {};  // ensure theres an element for 'nodeParameters'
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeRQNP();
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 30 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.mnemonic == "PARAMS"){
          comment = ' - received RQNP message '
          winston.debug({message: 'VLCB: RQNP valid'});
          this.hasTestPassed = true;
          RetrievedValues.addNodeParameter(1, msg.param1);
          RetrievedValues.addNodeParameter(2, msg.param2);
          RetrievedValues.addNodeParameter(3, msg.param3);
          RetrievedValues.addNodeParameter(4, msg.param4);
          RetrievedValues.addNodeParameter(5, msg.param5);
          RetrievedValues.addNodeParameter(6, msg.param6);
          RetrievedValues.addNodeParameter(7, msg.param7);
          for (var i = 1 ; i< 8; i++){
            winston.info({message: 'VLCB:      RQNP: ' 
              + NodeParameterNames[i] + ' : ' 
              + RetrievedValues.data.nodeParameters[i].value});
          }
        }
      })
      if(this.hasTestPassed){ break; }
    }

    if(!this.hasTestPassed){ comment = ' - missing expected PARAMS message'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNP (0x10)', comment);
    return this.hasTestPassed
  }
    

  // 11 - RQMN
  async test_RQMN(RetrievedValues) {
    winston.debug({message: 'VLCB: BEGIN RQMN test'});
    this.hasTestPassed = false;
    this.network.messagesIn = [];
    var msgData = cbusLib.encodeRQMN();
    this.network.write(msgData);
    var comment = ''

    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 30 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      this.network.messagesIn.forEach(msg => {
        if (msg.mnemonic == "NAME"){
          this.hasTestPassed = true;
          RetrievedValues.data["NAME"] = msg.name;
          comment = ' - received NAME ' + msg.name
        }
      })
      if(this.hasTestPassed){ break; }
    }

    if(!this.hasTestPassed){ comment = ' - missing expected NAME message'; }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'RQMN (0x11)', comment);
    return this.hasTestPassed
}
    

}

