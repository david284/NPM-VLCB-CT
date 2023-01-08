'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


var NodeParameterText = [
    "Number of parameters",		        // 0
    "Manufacturer’s Id",                // 1
    "Minor Version",                    // 2
    "Module Type",                      // 3
    "No. of events supported",          // 4
    "No. of Event Variables per event", // 5
    "No. of Node Variables",            // 6
    "Major Version",                    // 7
	"Node Flags"						// 8
    ];
	

// storage for values retrieved from module under test	
var retrieved_values = {	"nodeParameters": {}
};


class SetupMode_tests {

    constructor(NETWORK) {
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.inSetupMode = false;
        this.test_nodeNumber = 0;
        this.response_time = 200;
        this.passed_count = 0;
		this.failed_count = 0;
    }


    async runTests() {
		winston.debug({message: '=======================================-=============================='});
		winston.debug({message: '------------------------------- Setup Mode tests ---------------------'});
		winston.debug({message: '=======================================-=============================='});
		
        winston.info({message: 'MERGLCB: put module into setup'});
        var setup_tries = 0;
        while (1){
            await this.sleep(1000);
            setup_tries++;
			this.checkForRQNN();
            if (this.inSetupMode) break;
            if (setup_tries > 20) break;
            winston.info({message: 'MERGLCB: waiting for RQNN (setup) ' + setup_tries + ' of 20' });
        }
		
		// need module to be in setup mode to start the tests
        if (this.inSetupMode) {
            this.passed_count=1;     // passed first test if in setup
            // do opcodes only possible in setup mode
            await this.test_RQMN();
            await this.test_RQNP();
            await this.test_SNN();      // takes module out of setup mode
			
			// now setup mode completed, we should have retrieved all the identifying info about the module (RQMN & RQNP)
			
        } else {
            winston.info({message: ''});
            winston.info({message: 'MERGLCB: failed to go into setup'});
        }
		
        winston.info({message: 'Setup Mode Test run finished \n Passed count : ' + this.passed_count + '\n\x1B[31m Failed count : ' + this.failed_count + '\x1B[37m'});
        winston.info({message: ' '});                       // blank line to separate tests
		
		winston.debug({message: 'MERGLCB: MNS : retrieved_values ' + JSON.stringify(retrieved_values)});
		return retrieved_values;
    }

    sleep(timeout) {
        return new Promise(function (resolve, reject) {
            //here our function should be implemented 
            setTimeout(()=>{
                resolve();
                ;} , timeout
            );
        });
    }
	
	checkForRQNN(){
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
    
        
    test_RQNP() {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN RQNP test'});
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
						retrieved_values ["nodeParameters"]["1"] = message.param1;
						retrieved_values ["nodeParameters"]["2"] = message.param2;
						retrieved_values ["nodeParameters"]["3"] = message.param3;
						retrieved_values ["nodeParameters"]["4"] = message.param4;
						retrieved_values ["nodeParameters"]["5"] = message.param5;
						retrieved_values ["nodeParameters"]["6"] = message.param6;
						retrieved_values ["nodeParameters"]["7"] = message.param7;
                        winston.info({message: '      RQNP: ' + NodeParameterText[1] + ' : ' + message.param1});
                        winston.info({message: '      RQNP: ' + NodeParameterText[2] + '  : ' + message.param2});
                        winston.info({message: '      RQNP: ' + NodeParameterText[3] + '      : ' + message.param3});
                        winston.info({message: '      RQNP: ' + NodeParameterText[4] + '  : ' + message.param4});
                        winston.info({message: '      RQNP: ' + NodeParameterText[5] + ' : ' + message.param5});
                        winston.info({message: '      RQNP: ' + NodeParameterText[6] + '  : ' + message.param6});
                        winston.info({message: '      RQNP: ' + NodeParameterText[7] + '  : ' + message.param7});
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
                ;} , this.response_time
            );
        }.bind(this));
    }
    
    test_RQMN() {
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
					this.passed_count++;
				}else{
					winston.info({message: 'MERGLCB: RQMN failed'});
					this.failed_count++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
    
    test_SNN() {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN SNN test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeSNN(this.test_nodeNumber);
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
                    var message = this.getMessage('NNACK');
                    if (message.mnemonic == "NNACK"){
                        if (message.nodeNumber == this.test_nodeNumber) {
                            winston.info({message: 'MERGLCB: SNN passed'});
                            this.hasTestPassed = true;
                        }
                    }
                }
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: SNN passed'}); 
					this.passed_count++;
				}else{
					winston.info({message: 'MERGLCB: SNN failed'});
					this.failed_count++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
    

}

module.exports = {
    SetupMode_tests: SetupMode_tests
}