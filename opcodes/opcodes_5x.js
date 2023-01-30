'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

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
		this.hasTestPassed = false;
		var message = this.getMessage('RQNN');
			if (message != null) {
            if (message.mnemonic == "RQNN"){
                this.test_nodeNumber = message.nodeNumber;
				retrieved_values ["nodeNumber"] = message.nodeNumber;
                this.inSetupMode = true;
				this.hasTestPassed = true;
                winston.info({message: 'MERGLCB:      module ' + this.test_nodeNumber + ' in setup mode '});
			}
		}

		if (this.hasTestPassed){ 
			winston.info({message: 'MERGLCB: RQNN passed'}); 
			retrieved_values.TestsPassed++;
		}else{
			// in this instance, we're calling this method multiple times until we get an RQNN,
			// so don't mark each try as a fail - the upper layer will timeout and fail if didn't get a pass
			winston.info({message: 'MERGLCB: no RQNN received....'});
		}
		winston.debug({message: '-'});
	}


    // 0x5E - NNRST
    test_NNRST(retrieved_values) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN NNRST test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeNNRST(retrieved_values.nodeNumber);
            this.network.write(msgData);
            setTimeout(()=>{
				var GRSPreceived = false;
                if (this.network.messagesIn.length > 0){
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if (msg.nodeNumber == retrieved_values.nodeNumber) {
							if (msg.mnemonic == "GRSP"){
								GRSPreceived = true;
								if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
									this.hasTestPassed = true;
								}else {
									winston.info({message: 'MERGLCB: GRSP requestOpCode:'
										+ '\n  Expected ' + cbusLib.decode(msgData).opCode
										+ '\n  Actual ' + msg.requestOpCode}); 
								}
							}
						}
					});
				}
				
				if (!GRSPreceived) { winston.info({message: 'MERGLCB: NNRST Fail: no GRSP received'}); }
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: NNRST passed'}); 
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: NNRST failed'});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , 500
            );
        }.bind(this));
    }
	
	
}

module.exports = {
    opcodes_5x: opcodes_5x
}