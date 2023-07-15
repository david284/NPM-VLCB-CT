'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const BaseService = require('./Services/Baseservice.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


// extends base class as example of how to do it - but not used

class ExampleTests extends BaseService{

    constructor(NETWORK) {
		super();
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.passed_count = 0;
		this.failed_count = 0;
    }

	//
	// runTests is an async function so that the 'await' command can be used
	// This is need to ensure that the flow  waits for each test to complete before moving to the next test
	// Each test typically has a timeout to wait for a response from the module under test
	//
    async runTests(retrieved_values, module_descriptor) {
		winston.debug({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.debug({message: '==========================================================='});
		winston.info({message:  '---------------------- Example tests ----------------------'});
		winston.debug({message: '==========================================================='});
		winston.debug({message: ' '});
		

        await this.sleep(1000);								// example of a delay
        await this.test_harness();
		
        winston.info({message: 'Examples Test run finished\n'});
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
	
    
    test_harness()
    {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'VLCB: BEGIN test_harness'});
            this.hasTestPassed = false;
			// would typically be sending a command to the module under test here
			
            setTimeout(()=>{
				// would typically be checking that a response has been received from the module under test here
                winston.debug({message: 'VLCB: test_harness timeout done'});
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
        winston.debug({message: 'VLCB: test_function'});
    }
	

}

module.exports = {
    ExampleTests: ExampleTests
}