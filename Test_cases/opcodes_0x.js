'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


module.exports = class opcodes_0x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_0x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
    }
	
            
  // 0x0D - QNN
  async test_QNN(RetrievedValues) {
      winston.debug({message: 'VLCB: BEGIN QNN test'});
      this.hasTestPassed = false;
      this.network.messagesIn = [];
      var msgData = cbusLib.encodeQNN();
      this.network.write(msgData);
      var comment = ''
      var expectedNodeNumber = RetrievedValues.getNodeNumber()

    var startTime = Date.now();
    // set maximum wait as 1000 milliSeconds, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 50 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
        this.network.messagesIn.forEach(msg => {
          if (msg.mnemonic == "PNN"){
            // allow messages from all nodes as we can build up an array of all the modules
            var newModule = {
              "nodeNumber":msg.nodeNumber,
              "manufacturerId":msg.manufacturerId,
              "moduleId":msg.moduleId,
              "flags":msg.flags,
              "CANID":parseInt(msg.encoded.substr(3, 2), 16)>>1
            }
            // ok, store this data, using node number as index (prevents duplicate if re-run)
            RetrievedValues.data.modules[msg.nodeNumber] = newModule;
            // we check matching node number here, as we're expecting all the nodes to respond to QNN
            // and we'll only pass the test if we get a response from the node under test
            if (isNaN(expectedNodeNumber)) {
              // don't have an expected node number, so assume good
              this.hasTestPassed = true;
            } else {
              // we have an expected node number, so check it
              if (msg.nodeNumber == expectedNodeNumber){
                comment = 'PNN received for node ' + msg.nodeNumber
                this.hasTestPassed = true;
              }
            }
          }
        })
      }

      if(!this.hasTestPassed){ comment = ' - missing expected PNN for node ' + expectedNodeNumber; }
      utils.processResult(RetrievedValues, this.hasTestPassed, 'QNN (0x0D)', comment);
      return this.hasTestPassed
    } // end test_QNN

}

