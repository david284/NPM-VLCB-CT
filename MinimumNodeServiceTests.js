'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const ServiceTypeNames = require('./ServiceTypeNames.js');

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


class MinimumNodeServiceTests {

    constructor(NETWORK) {
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.inSetupMode = false;
        this.response_time = 200;
        this.passed_count = 0;
		this.failed_count = 0;
    }


    async runTests(retrieved_values, module_descriptor) {
		winston.debug({message: ' '});
		winston.debug({message: '========================================'});
		//                       0123456789012345678998765432109876543210
		winston.info({message: '------- Minimum Node Service tests ------'});
		winston.debug({message: '========================================'});
		winston.debug({message: ' '});
		

		
		winston.debug({message: 'MERGLCB: MNS : retrieved_values ' + JSON.stringify(retrieved_values)});
		winston.debug({message: 'MERGLCB: MNS : Module Descriptor ' + JSON.stringify(module_descriptor)});

			// now do rest of 'normal' opcodes, but only if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){
				
				// check for response to QNN from module under test
				await this.test_QNN(retrieved_values.nodeNumber);
				
				// now get node parameter 0, as it tells us how many more node parameters there are
				// we don't get that info from the RQNP command unfortunately
				await this.test_RQNPN(retrieved_values.nodeNumber, 0, retrieved_values, module_descriptor);
				
				// now retrieve all the other node parameters, and check against module_descriptor file
				//using value now stored in parameter 0
				for (var i=1; i<retrieved_values["nodeParameters"]["0"]+1; i++) {
					await this.test_RQNPN(retrieved_values.nodeNumber, i, retrieved_values, module_descriptor);
				}
				
				//
				await this.test_RQSD(retrieved_values, 0);
				
				//
				// Add more tests.......
				//
				
			} else {
				winston.info({message: 'MERGLCB: tests aborted - invalid module descriptor file'});
			}
		
        winston.info({message: 'MNS Test run finished \n Passed count : ' + this.passed_count + '\n\x1B[31m Failed count : ' + this.failed_count + '\x1B[37m'});
        winston.info({message: ' '});                       // blank line to separate tests
		
		winston.debug({message: 'MERGLCB: MNS : Module Descriptor ' + JSON.stringify(module_descriptor)});
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
    
    test_RQNPN(NodeNumber, parameterIndex, retrieved_values, module_descriptor) {
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
						// ok - we have a value, so assume the test has passed - now do additional consistency tests
						// and fail the test if any of these tests fail
						this.hasTestPassed = true;
						
						//start building an ouput string in case it fails
						var fail_output = ' - parameter index : ' + parameterIndex +'\n';
						fail_output += '  actual value : ' + message.parameterValue +'\n';
						
						if (retrieved_values["nodeParameters"][parameterIndex] != null){
							fail_output += '  retrieved_value : ' + retrieved_values ["nodeParameters"][parameterIndex] +'\n';
							// we have previously read this value, so check it's still the same
							if ( retrieved_values ["nodeParameters"][parameterIndex] != message.parameterValue){
								this.hasTestPassed = false;
							}
						} else {
							// new value, so save it
							retrieved_values ["nodeParameters"][parameterIndex] = message.parameterValue;
							winston.debug({message: 'MERGLCB: Node Parameter ' + parameterIndex + ' added to retrieved_values'});
						}
						
						// if it's in the module_descriptor, we need to check we've read the same value
						if (module_descriptor.nodeParameters[parameterIndex] != null) {
							if (module_descriptor.nodeParameters[parameterIndex].value != null) {
								fail_output += '  module_descriptor : ' + module_descriptor.nodeParameters[parameterIndex].value +'\n';
								if ( module_descriptor.nodeParameters[parameterIndex].value != message.parameterValue) {
									this.hasTestPassed = false;
								}
							} else {
								winston.info({message: 'MERGLCB: Warning: No module_descriptor value entry for Node Parameter ' + parameterIndex});
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
					winston.info({message: 'MERGLCB: RQNPN failed ' + fail_output});
					this.failed_count++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , 100
            );
        }.bind(this));
    }
 
    
    test_RQSD(retrieved_values, ServiceIndex) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN RQSD test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRQSD(retrieved_values.nodeNumber, ServiceIndex);
            this.network.write(msgData);
			if (retrieved_values["Services"] == null){
				retrieved_values["Services"] = {};
			}
            setTimeout(()=>{
					
                if (this.network.messagesIn.length > 0){
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if (msg.mnemonic == "SD"){
							if (msg.nodeNumber == retrieved_values.nodeNumber){
								this.hasTestPassed = true;
								retrieved_values["Services"][msg.ServiceIndex] = {};
								retrieved_values["Services"][msg.ServiceIndex]["ServiceIndex"] = msg.ServiceIndex;
								retrieved_values["Services"][msg.ServiceIndex]["ServiceType"] = msg.ServiceType;
								retrieved_values["Services"][msg.ServiceIndex]["ServiceVersion"] = msg.ServiceVersion;
								retrieved_values["Services"][msg.ServiceIndex]["ServiceName"] = ServiceTypeNames[msg.ServiceType];
							}
							else{
								winston.info({message: 'MERGLCB: RQSD - node number - received : ' + msg.nodeNumber + " expected : " + retrieved_values.nodeNumber});
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