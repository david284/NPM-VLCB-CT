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


class opcodes_1x {

    constructor(NETWORK) {
    //                        0123456789012345678901234567890123456789
    winston.debug({message:  '----------------- opcodes_1x Constructor'});
    
    this.network = NETWORK;
        this.hasTestPassed = false;
    }
  
  
  // 10 - RQNP
  test_RQNP(RetrievedValues) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN RQNP test'});
      RetrievedValues.data["nodeParameters"] = {};  // ensure theres an element for 'nodeParameters'
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeRQNP();
      this.network.write(msgData);
      setTimeout(()=>{
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
            if (msg.mnemonic == "PARAMS"){
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
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQNP');
        resolve();
      }, 100 );
    }.bind(this));
  }
    

  // 11 - RQMN
  test_RQMN(RetrievedValues) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN RQMN test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeRQMN();
      this.network.write(msgData);
      setTimeout(()=>{
        if (this.network.messagesIn.length > 0){
          this.network.messagesIn.forEach(element => {
            var msg = cbusLib.decode(element);
            winston.info({message: 'VLCB:      msg received: ' + msg.text}); 
            if (msg.mnemonic == "NAME"){
              this.hasTestPassed = true;
              RetrievedValues.data["NAME"] = msg.name;
              winston.info({message: 'VLCB:      RQMN: Name  : ' + msg.name});
            }
          })
        }
        utils.processResult(RetrievedValues, this.hasTestPassed, 'RQMN');
        resolve();
      }, 100 )
    }.bind(this));
  }
    

}

module.exports = {
    opcodes_1x: opcodes_1x
}