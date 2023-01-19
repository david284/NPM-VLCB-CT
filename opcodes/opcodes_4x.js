'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class opcodes_4x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_4x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.response_time = 200;
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


    // 0x42 SNN
	//
    test_SNN(retrieved_values) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN SNN test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeSNN(retrieved_values.nodeNumber);
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
                    var message = this.getMessage('NNACK');
                    if (message.mnemonic == "NNACK"){
                        if (message.nodeNumber == retrieved_values.nodeNumber) {
                            winston.info({message: 'MERGLCB: SNN passed'});
                            this.hasTestPassed = true;
                        }
                    }
                }
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: SNN passed'}); 
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: SNN failed'});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
    
	
    // 0x4F - NNRSM
    test_NNRSM(retrieved_values) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN NNRSM test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeNNRSM(retrieved_values.nodeNumber);
            this.network.write(msgData);
            setTimeout(()=>{
				var GRSPreceived = false;
                if (this.network.messagesIn.length > 0){
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if (msg.mnemonic == "GRSP"){
							GRSPreceived = true;
							if (msg.nodeNumber == retrieved_values.nodeNumber) {
								if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
									this.hasTestPassed = true;
								}else {
									winston.info({message: 'MERGLCB: GRSP requestOpCode:'
										+ '\n  Expected ' + cbusLib.decode(msgData).opCode
										+ '\n  Actual ' + msg.requestOpCode}); 
								}
							} else {
									winston.info({message: 'MERGLCB: GRSP nodeNumber:' +
										+ '\n  Expected ' + cbusLib.decode(msgData).nodeNumber
										+ '\n  Actual ' + msg.nodeNumber}); 
							}
						}
					});
				}
				
				if (!GRSPreceived) { winston.info({message: 'MERGLCB: NNRSM Fail: no GRSP received'}); }
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: NNRSM passed'}); 
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: NNRSM failed'});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
	
	

}

module.exports = {
    opcodes_4x: opcodes_4x
}