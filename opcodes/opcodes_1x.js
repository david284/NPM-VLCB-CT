'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const NodeParameterNames = require('./../Definitions/Text_NodeParameterNames.js');


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
	
	
	// 10 - RQNP
	test_RQNP(retrieved_values) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN RQNP test'});
			retrieved_values["nodeParameters"] = {}; 	// ensure theres an element for 'nodeParameters'
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRQNP();
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
                    var message = this.getMessage('PARAMS');
                    if (message.mnemonic == "PARAMS"){
                        winston.info({message: 'MERGLCB: RQNP passed'});
                        this.hasTestPassed = true;
						retrieved_values ["nodeParameters"]["1"] = { "name":NodeParameterNames[1], "value": message.param1 };
						retrieved_values ["nodeParameters"]["2"] = { "name":NodeParameterNames[2], "value": message.param2 };
						retrieved_values ["nodeParameters"]["3"] = { "name":NodeParameterNames[3], "value": message.param3 };
						retrieved_values ["nodeParameters"]["4"] = { "name":NodeParameterNames[4], "value": message.param4 };
						retrieved_values ["nodeParameters"]["5"] = { "name":NodeParameterNames[5], "value": message.param5 };
						retrieved_values ["nodeParameters"]["6"] = { "name":NodeParameterNames[6], "value": message.param6 };
						retrieved_values ["nodeParameters"]["7"] = { "name":NodeParameterNames[7], "value": message.param7 };
                        winston.info({message: 'MERGLCB:      RQNP: ' + NodeParameterNames[1] + ' : ' + message.param1});
                        winston.info({message: 'MERGLCB:      RQNP: ' + NodeParameterNames[2] + '  : ' + message.param2});
                        winston.info({message: 'MERGLCB:      RQNP: ' + NodeParameterNames[3] + '      : ' + message.param3});
                        winston.info({message: 'MERGLCB:      RQNP: ' + NodeParameterNames[4] + '  : ' + message.param4});
                        winston.info({message: 'MERGLCB:      RQNP: ' + NodeParameterNames[5] + ' : ' + message.param5});
                        winston.info({message: 'MERGLCB:      RQNP: ' + NodeParameterNames[6] + '  : ' + message.param6});
                        winston.info({message: 'MERGLCB:      RQNP: ' + NodeParameterNames[7] + '  : ' + message.param7});
                    }
                }
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: RQNP passed'}); 
					this.passed_count++;
				}else{
					winston.info({message: 'MERGLCB: RQNP failed'});
					this.failed_count++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , 100
            );
        }.bind(this));
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
                        winston.info({message: 'MERGLCB:      RQMN: Name  : ' + message.name});
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