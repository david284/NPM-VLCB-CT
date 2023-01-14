'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class opcodes_5x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_5x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.inSetupMode = false;
        this.test_nodeNumber = 0;
    }
	
	    //
    // get first instance of a received message with the specified mnemonic
    //
    getMessage(mnemonic){
        var message = undefined;
        for (var i=0; i<this.network.messagesIn.length; i++){
            message = this.network.messagesIn[i];
            if (message.mnemonic == mnemonic){
                winston.debug({message: 'MERGLCB: Found message ' + mnemonic});
                break;
            }
        }
        if (message == undefined){                 
            winston.debug({message: 'MERGLCB: No message found for' + mnemonic});
        }
        return message
    }

	// 0x50 RQNN
	checkForRQNN(retrieved_values){
		var message = this.getMessage('RQNN');
			if (message != null) {
            if (message.mnemonic == "RQNN"){
                this.test_nodeNumber = message.nodeNumber;
				retrieved_values ["nodeNumber"] = message.nodeNumber;
                this.inSetupMode = true;
                winston.info({message: 'MERGLCB: module ' + this.test_nodeNumber + ' in setup mode '});
			}
		}
	}

}

module.exports = {
    opcodes_5x: opcodes_5x
}