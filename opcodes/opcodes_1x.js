'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

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

	// 11 - RQMN
    test_RQMN(retrieved_values) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN RQMN test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRQMN();
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
                    var message = this.getMessage('NAME');
                    if (message.mnemonic == "NAME"){
                        winston.info({message: 'MERGLCB: RQMN passed'});
                        this.hasTestPassed = true;
						retrieved_values ["NAME"] = message.name;
                        winston.info({message: '      RQMN: Name  : ' + message.name});
                    }
                }
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: RQMN passed'}); 
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: RQMN failed'});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , 100
            );
        }.bind(this));
    }
    

}

module.exports = {
    opcodes_1x: opcodes_1x
}