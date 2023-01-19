'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class opcodes_0x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_0x Constructor'});
		
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

            
    // 0x0D - QNN
    test_QNN(retrieved_values) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN QNN test'});
            this.hasTestPassed = false;
			retrieved_values["modules"] = {}; 	// ensure theres an element for 'modules'
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeQNN();
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
					var i=0;
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						winston.info({message: 'MERGLCB:      ' + msg.text});
						var newModule = {
							"nodeNumber":msg.nodeNumber,
							"manufacturerId":msg.manufacturerId,
							"moduleId":msg.moduleId,
							"flags":msg.flags,
							"CANID":parseInt(msg.encoded.substr(3, 2), 16)>>1
						}
						retrieved_values["modules"][i++] = newModule;
						//
						if (msg.mnemonic == "PNN"){
							if (msg.nodeNumber == retrieved_values.nodeNumber){
								winston.info({message: 'MERGLCB: QNN passed - Node ' + msg.nodeNumber});
								this.hasTestPassed = true;
							}
						}
					});
				}
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: QNN passed'}); 
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: QNN failed'});
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
    opcodes_0x: opcodes_0x
}