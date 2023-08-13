'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./utilities.js');

const opcodes_0x = require('./opcodes/opcodes_0x.js');
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
		this.Title = 'Setup Mode';
        this.hasTestPassed = false;
        this.inSetupMode = false;
        this.test_nodeNumber = 0;
        this.response_time = 200;
        this.passed_count = 0;
		this.failed_count = 0;
		
		this.opcodes_0x = new opcodes_0x(this.network);
		this.opcodes_1x = new opcodes_1x(this.network);
		this.opcodes_4x = new opcodes_4x(this.network);
		this.opcodes_5x = new opcodes_5x(this.network);
		this.opcodes_7x = new opcodes_7x.opcodes_7x(this.network);
    }


    async runTests(RetrievedValues) {
		utils.DisplayStartDivider(this.Title + ' tests');


        await utils.sleep(100);	//small delay to allow conenction to be established
		
		// we need the module in setup mode
		// try to put the module into setup using the MODE command
		// but prompt for manual intervention if that doesn't work (allows testing of legacy modules)
    
    // check for response to QNN from module under test - otherwise node might not be responding
		await this.opcodes_0x.test_QNN(RetrievedValues);
		
    winston.info({message: 'VLCB:      put module into setup'});

    await this.opcodes_7x.test_MODE(RetrievedValues, 0)

    // now lets check if it has really gone into setup & sent us an RQNN
		RetrievedValues.data["setup_completed"]= false;
        var setup_tries = 0;
		
        await utils.sleep(200);		// delay to allow the MODE command to work
		
        while (1){
            setup_tries++;
			this.opcodes_5x.checkForRQNN(RetrievedValues);
			this.inSetupMode = this.opcodes_5x.inSetupMode;
            this.test_nodeNumber = this.opcodes_5x.test_nodeNumber;
            if (this.inSetupMode) break;
            if (setup_tries > 20) break;
            winston.info({message: 'VLCB:      waiting for RQNN (setup) ' + setup_tries + ' of 20' });
            await utils.sleep(1000);
        }
		
		// need module to be in setup mode to start the tests
        if (this.inSetupMode) {
            this.passed_count=1;     // passed first test if in setup
            // do opcodes only possible in setup mode
            await this.opcodes_1x.test_RQMN(RetrievedValues);
            await this.opcodes_1x.test_RQNP(RetrievedValues);
            await this.opcodes_4x.test_SNN(RetrievedValues);      // takes module out of setup mode
			
			RetrievedValues.data.setup_completed = true;
			
			// now setup mode completed, we should have retrieved all the identifying info about the module (RQMN & RQNP)
			
        } else {
            winston.info({message: ''});
            winston.info({message: 'VLCB:      failed to go into setup'});
			RetrievedValues.data.TestsFailed++;
        }
		
		utils.DisplayEndDivider(this.Title + ' tests finished');
		// update total tests counts
		RetrievedValues.data.TestsPassed += this.passed_count;
		RetrievedValues.data.TestsFailed += this.failed_count;
		
		winston.debug({message: 'VLCB: Setup Mode : RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, "    ")});
		return RetrievedValues;
    }
}

module.exports = {
    SetupMode_tests: SetupMode_tests
}