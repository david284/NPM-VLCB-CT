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
    test_QNN(RetrievedValues) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN QNN test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeQNN();
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
					var i=0;
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if (msg.mnemonic == "PNN"){
							// allow messages from all nodes as we can build up an array of all the modules
							winston.info({message: 'MERGLCB:      ' + msg.text});
							var newModule = {
								"nodeNumber":msg.nodeNumber,
								"manufacturerId":msg.manufacturerId,
								"moduleId":msg.moduleId,
								"flags":msg.flags,
								"CANID":parseInt(msg.encoded.substr(3, 2), 16)>>1
							}
							RetrievedValues.data.modules[i++] = newModule;
							
							// we check matching node number here, as we're expecting all the nodes to respond to QNN
							// and we'll only pass the test if we get a response from the node under test
							if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
								winston.info({message: 'MERGLCB: QNN passed - Node ' + msg.nodeNumber});
								this.hasTestPassed = true;
							}
						}
					});
				}
				
				utils.processResult(RetrievedValues, this.hasTestPassed, 'QNN');
				
                resolve();
                ;} , 500
            );
        }.bind(this));
    }


            
	

}

module.exports = {
    opcodes_0x: opcodes_0x
}