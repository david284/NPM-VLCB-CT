'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');

const opcodes_0x = require('./../opcodes/opcodes_0x.js');
const opcodes_7x = require('./../opcodes/opcodes_7x.js');
const opcodes_8x = require('./../opcodes/opcodes_8x.js');
const opcodes_9x = require('./../opcodes/opcodes_9x.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


exports.NodeVariableServiceTests = class NodeVariableServiceTests {

    constructor(NETWORK) {
		this.network = NETWORK;
		this.Title = 'Node Variable Service';
        this.hasTestPassed = false;
		
		this.opcodes_0x = new opcodes_0x(this.network);
		this.opcodes_7x = new opcodes_7x.opcodes_7x(this.network);
		this.opcodes_8x = new opcodes_8x.opcodes_8x(this.network);
		this.opcodes_9x = new opcodes_9x.opcodes_9x(this.network);
    }


    async runTests(RetrievedValues, module_descriptor, serviceIndex) {
		utils.DisplayStartDivider(this.Title + ' tests');
		
			// only do tests if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){

				// this will get the service data that this module supports
				await this.opcodes_7x.test_RQSD(RetrievedValues, serviceIndex);
								
				// this will read all the node variables
				await this.opcodes_7x.test_NVRD(RetrievedValues, serviceIndex, 0);
				
				// test that the number of node Variables matches published count in nodeParameters
				this.test_NodeVariableCount(RetrievedValues, serviceIndex);
				
				// test the first node variable, using the count of variables received
				await this.opcodes_7x.test_NVRD(RetrievedValues, serviceIndex, 1);
				
				// test the last node variable, using the count of variables received
				await this.opcodes_7x.test_NVRD(RetrievedValues, serviceIndex, RetrievedValues.data.nodeParameters[6].value);
				
				// now test the last node variable + 1, expecting an error message
				await this.opcodes_7x.test_NVRD_INVALID_INDEX(RetrievedValues, serviceIndex, RetrievedValues.data.nodeParameters[6].value + 1);
				
				// now test a short message, expecting an error message
				await this.opcodes_7x.test_NVRD_SHORT(RetrievedValues, serviceIndex, 1);

				// set node variable 1 with existing value (non-destructive)
        var value1 = RetrievedValues.data.nodeVariables[1]
				await this.opcodes_9x.test_NVSET(RetrievedValues, 1, value1);

				// set last node variable with existing value (non-destructive) 
        var lastValue = RetrievedValues.data.nodeVariables[RetrievedValues.data.nodeParameters[6].value]
				await this.opcodes_9x.test_NVSET(RetrievedValues, RetrievedValues.data.nodeParameters[6].value, lastValue);

				// set last node variable + 1, value doesn't matter, as we're expecting the command to be rejected with an error response
				await this.opcodes_9x.test_NVSET_INVALID_INDEX(RetrievedValues, RetrievedValues.data.nodeParameters[6].value + 1, 0);

				// now test a short message,  value doesn't matter, as we're expecting the command to be rejected with an error response
				await this.opcodes_9x.test_NVSET_SHORT(RetrievedValues, RetrievedValues.data.nodeParameters[6].value, 0);
				
				// set & read the first node variable with existing value (non-destructive)
				await this.opcodes_8x.test_NVSETRD(RetrievedValues, 1, value1);
				
				// set & read the last node variable with existing value (non-destructive)
				await this.opcodes_8x.test_NVSETRD(RetrievedValues, RetrievedValues.data.nodeParameters[6].value, lastValue);
				
				// now test the last node variable + 1, expecting an error message
				await this.opcodes_8x.test_NVSETRD_INVALID_INDEX(RetrievedValues, RetrievedValues.data.nodeParameters[6].value + 1, 0);
				
				// now test a short message, expecting an error message
				await this.opcodes_8x.test_NVSETRD_SHORT(RetrievedValues, 1, 0);

        // now request diagnostics just for this service
        await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, 0);

        // now request first diagnostic just for this service
        await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, 1);

        // use MaxDiagnosticCode for next tests, but only if it has been reported
        if (RetrievedValues.data.Services[serviceIndex].MaxDiagnosticCode != undefined){
          // now request last diagnostic just for this service
          await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, RetrievedValues.data.Services[serviceIndex].MaxDiagnosticCode);
          //
          // test the error returned with invalid diagnostic code
          await this.opcodes_8x.test_RDGN_INVALID_DIAG(RetrievedValues, serviceIndex, RetrievedValues.data.Services[serviceIndex].MaxDiagnosticCode + 1);
        } else {
          winston.info({message: 'VLCB: test_RDGN_INVALID_DIAG test skipped - no reported diagnostic codes'});
        }				
				
			} else {
				winston.info({message: 'VLCB: tests aborted - invalid module descriptor file'});
			}
		
		utils.DisplayEndDivider(this.Title + ' tests finished');
		return RetrievedValues;
    }

	
	
	test_NodeVariableCount(RetrievedValues, serviceIndex) {
		this.hasTestPassed = false;
		var nodeVariableCount = RetrievedValues.getNodeVariableCount();
		winston.debug({message: 'VLCB: NVRD Node Variable Count test '
						+ '\n      expected ' + RetrievedValues.data.nodeParameters[6].value
						+ '\n      actual   ' + nodeVariableCount 
						});
		
		if (RetrievedValues.data.nodeParameters[6].value == nodeVariableCount){
			this.hasTestPassed = true;
		} else {
			winston.info({message: 'VLCB:       NVRD Node Variable Count '
						+ '\n      expected ' + RetrievedValues.data.nodeParameters[6].value
						+ '\n      actual   ' + nodeVariableCount 
						});
		}
		
		utils.processResult(RetrievedValues, this.hasTestPassed, 'NVRD Node Variable Count');
		
	}

}

