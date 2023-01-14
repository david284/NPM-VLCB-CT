'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const NodeParameterNames = require('./../Text_NodeParameterNames.js');
const ServiceTypeNames = require('./../Text_ServiceTypeNames.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class opcodes_7x {

    constructor(NETWORK) {
		winston.debug({message:  ' '});
		//                        012345678901234567890123456789987654321098765432109876543210
		winston.debug({message:  '------------------------ opcodes_7x -----------------------\n'});
		
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

            



	// 0x73 - RQNPN
    test_RQNPN(parameterIndex, retrieved_values, module_descriptor) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: Get Param ' + parameterIndex});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRQNPN(retrieved_values.nodeNumber, parameterIndex);
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
						// and a warning outputstring also
						var warning_output = "";
						
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
								warning_output = ' :: Warning: No matching module_descriptor value entry';
							}
						} else {
							warning_output =  ' :: Warning: No matching module_descriptor file entry';
						}
					}
				}
				if (this.hasTestPassed) {
                    winston.info({message: 'MERGLCB: RQNPN index ' + parameterIndex + ' passed - ' + NodeParameterNames[parameterIndex] + warning_output});
                    winston.debug({message: 'MERGLCB: RQNPN value ' + message.parameterValue});
					retrieved_values.TestsPassed++;
				} else {
					winston.info({message: 'MERGLCB: RQNPN failed - ' + NodeParameterNames[parameterIndex] + fail_output});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , 100
            );
        }.bind(this));
    }
 
    
    // 0x75 - CANID
    test_CANID(retrieved_values, CANID) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN CANID test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeCANID(retrieved_values.nodeNumber, CANID);
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
					/*
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
					*/
				}
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: CANID passed'}); 
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: CANID failed'});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
	
	
	// 0x78 - RQSD
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
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: RQSD failed'});
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
    opcodes_7x: opcodes_7x
}