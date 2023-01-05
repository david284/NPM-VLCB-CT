'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const fetch_file = require('./fetch_module_descriptor.js')

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
var retrieved_values = {};

// JSON array of expected module values to test against
var module_descriptor;


class MinimumNodeServiceTests {

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
			// so fetch matching module descriptor file
			module_descriptor = fetch_file.module_descriptor(retrieved_values); 			
			
			// now do rest of 'normal' opcodes, but only if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){
				
				// check for response to QNN from module under test
				await this.test_QNN(this.test_nodeNumber);
				
				// now get node parameter 0, as it tells us how many more node parameters there are
				// we don't get that info from the RQNP command unfortunately
				await this.test_RQNPN(this.test_nodeNumber, 0, module_descriptor);
				
				// now retrieve all the other node parameters, and check against module_descriptor file
				for (var i=1; i<retrieved_values["Number of parameters"]+1; i++) {
					await this.test_RQNPN(this.test_nodeNumber, i, module_descriptor);
				}
				
				//
				await this.test_RQSD(this.test_nodeNumber, 0);
				
				//
				// Add more tests.......
				//
				
			} else {
				winston.info({message: 'MERGLCB: tests aborted - failed to retrieve module descriptor file'});
			}
			
        } else {
            winston.info({message: ''});
            winston.info({message: 'MERGLCB: failed to go into setup'});
        }
		
        winston.info({message: ' '});                       // blank line to separate tests
        winston.info({message: 'Test run finished - Passed count : ' + this.passed_count + ' Failed count : ' + this.failed_count});
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
						retrieved_values [NodeParameterText[1]] = message.param1;
						retrieved_values [NodeParameterText[2]] = message.param2;
						retrieved_values [NodeParameterText[3]] = message.param3;
						retrieved_values [NodeParameterText[4]] = message.param4;
						retrieved_values [NodeParameterText[5]] = message.param5;
						retrieved_values [NodeParameterText[6]] = message.param6;
						retrieved_values [NodeParameterText[7]] = message.param7;
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
    
    test_QNN(test_node_number) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN QNN test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeQNN();
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
					
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						winston.info({message: msg.text});
						if (msg.mnemonic == "PNN"){
							if (msg.nodeNumber == test_node_number){
								winston.info({message: 'MERGLCB: QNN passed'});
								this.hasTestPassed = true;
							}
						}
					});
				}
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: QNN passed'}); 
					this.passed_count++;
				}else{
					winston.info({message: 'MERGLCB: QNN failed'});
					this.failed_count++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
    
    test_RQNPN(NodeNumber, parameterIndex, module_descriptor) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: Get Param ' + parameterIndex});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRQNPN(NodeNumber, parameterIndex);
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
                    var message = this.getMessage('PARAN');
                    if (message.mnemonic == "PARAN"){
						if ( parameterIndex == 0) {
							retrieved_values [NodeParameterText[0]] = message.parameterValue;
						}
						
						// ok - we have a value, so assume the test has passed - now do additional consistency tests
						// and fail the test if any of these tests fail
						this.hasTestPassed = true;
						if (retrieved_values [NodeParameterText[parameterIndex]] != null){
							if ( retrieved_values [NodeParameterText[parameterIndex]] != message.parameterValue){
								winston.info({message: 'MERGLCB: Node parameter failed retrieved value ' 
												+ NodeParameterText[parameterIndex]});
								this.hasTestPassed = false;
							}
						}
						
						if (module_descriptor.nodeParameters[parameterIndex] != null) {
							if ( module_descriptor.nodeParameters[parameterIndex].value != message.parameterValue) {
								winston.info({message: 'MERGLCB: Node parameter failed module_descriptor value ' 
												+ module_descriptor.nodeParameters[parameterIndex].name
												+ ' expected : ' + module_descriptor.nodeParameters[parameterIndex].value });
								this.hasTestPassed = false;
							}
						} else {
							winston.info({message: 'MERGLCB: Warning: No module_descriptor file entry for Node Parameter ' + parameterIndex});
						}
					}
				}
				if (this.hasTestPassed) {
                    winston.info({message: 'MERGLCB: RQNPN index ' + parameterIndex + ' passed'});
                    winston.debug({message: 'MERGLCB: RQNPN value ' + message.parameterValue});
					this.passed_count++;
				} else {
					winston.info({message: 'MERGLCB: RQNPN failed'});
					this.failed_count++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , 100
            );
        }.bind(this));
    }
 
    
    test_RQSD(NodeNumber, ServiceIndex) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN RQSD test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRQSD(NodeNumber, ServiceIndex);
            this.network.write(msgData);
            setTimeout(()=>{
					
                if (this.network.messagesIn.length > 0){
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if (msg.mnemonic == "SD"){
							if (msg.nodeNumber == NodeNumber){
								this.hasTestPassed = true;
							}
							else{
								winston.info({message: 'MERGLCB: RQSD - node number - received : ' + msg.nodeNumber + " expected : " + NodeNumber});
							}
						}
					});
				}
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: RQSD passed'}); 
					this.passed_count++;
				}else{
					winston.info({message: 'MERGLCB: RQSD failed'});
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
    MinimumNodeServiceTests: MinimumNodeServiceTests
}