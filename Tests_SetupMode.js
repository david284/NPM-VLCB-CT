'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const opcodes_1x = require('./opcodes/opcodes_1x.js');
const opcodes_4x = require('./opcodes/opcodes_4x.js');
const opcodes_5x = require('./opcodes/opcodes_5x.js');
const opcodes_7x = require('./opcodes/opcodes_7x.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class SetupMode_tests {

    constructor(NETWORK) {
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.inSetupMode = false;
        this.test_nodeNumber = 0;
        this.response_time = 200;
        this.passed_count = 0;
		this.failed_count = 0;
		
		this.opcodes_1x = new opcodes_1x.opcodes_1x(this.network);
		this.opcodes_4x = new opcodes_4x.opcodes_4x(this.network);
		this.opcodes_5x = new opcodes_5x.opcodes_5x(this.network);
		this.opcodes_7x = new opcodes_7x.opcodes_7x(this.network);
    }


    async runTests(retrieved_values) {
		winston.debug({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.debug({message: '==========================================================='});
		winston.info({message:  '-------------------- Setup Mode tests ---------------------'});
		winston.debug({message: '==========================================================='});
		winston.debug({message: ' '});

        await this.sleep(100);	//small delay to allow conenction to be established
		
		// we need the module in setup mode
		// try to put the module into setup using the MODE command
		// but prompt for manual intervention if that doesn't work (allows testing of legacy modules)
		
		retrieved_values["nodeNumber"] = 300;
		this.opcodes_7x.test_MODE(retrieved_values, 0)		// 0 - setup mode

        winston.info({message: 'MERGLCB: put module into setup'});
		retrieved_values["setup_completed"]= false;
        var setup_tries = 0;
		
        await this.sleep(500);		// delay to allow the MODE command to work
		
        while (1){
            setup_tries++;
			this.opcodes_5x.checkForRQNN(retrieved_values);
			this.inSetupMode = this.opcodes_5x.inSetupMode;
            this.test_nodeNumber = this.opcodes_5x.test_nodeNumber;
            if (this.inSetupMode) break;
            if (setup_tries > 20) break;
            winston.info({message: 'MERGLCB: waiting for RQNN (setup) ' + setup_tries + ' of 20' });
            await this.sleep(1000);
        }
		
		// need module to be in setup mode to start the tests
        if (this.inSetupMode) {
            this.passed_count=1;     // passed first test if in setup
            // do opcodes only possible in setup mode
            await this.opcodes_1x.test_RQMN(retrieved_values);
            await this.opcodes_1x.test_RQNP(retrieved_values);
            await this.opcodes_4x.test_SNN(retrieved_values);      // takes module out of setup mode
			
			retrieved_values.setup_completed = true;
			
			// now setup mode completed, we should have retrieved all the identifying info about the module (RQMN & RQNP)
			
        } else {
            winston.info({message: ''});
            winston.info({message: 'MERGLCB: failed to go into setup'});
			retrieved_values.TestsFailed++;
        }
		
        winston.info({message: 'MERGLCB: ==== Setup Mode Test run finished\n'});
		// update total tests counts
		retrieved_values.TestsPassed += this.passed_count;
		retrieved_values.TestsFailed += this.failed_count;
		
		winston.debug({message: 'MERGLCB: Setup Mode : retrieved_values \n' + JSON.stringify(retrieved_values, null, "    ")});
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
	
}

module.exports = {
    SetupMode_tests: SetupMode_tests
}