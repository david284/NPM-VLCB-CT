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


class ExampleTests {

    constructor(NETWORK) {
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.inSetupMode = false;
        this.test_nodeNumber = 0;
        this.response_time = 200;
        this.passed_count = 0;
    }


    async runTests() {
        winston.info({message: 'MERGLCB: example tests'});
		
        await this.test_harness();
		
        winston.info({message: ' '});                       // blank line to separate tests
        winston.info({message: 'Test run finished - Passed count : ' + this.passed_count});                       // blank line to separate tests
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
    
        
    
    test_harness()
    {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN test_harness'});
            this.hasTestPassed = false;
			
            setTimeout(()=>{
                winston.debug({message: 'MERGLCB: test_harness timeout done'});
                this.test_function();
				this.passed_count++;
				this.hasTestPassed = true;
				winston.debug({message: '-'});
                resolve();
                ;} , 100
            );
        }.bind(this));
    }

    test_function(){

        winston.debug({message: 'MERGLCB: test_function'});
    }
	

}

module.exports = {
    ExampleTests: ExampleTests
}