'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');

const opcodes_5x = require('./../Test_cases/opcodes_5x.js');
const opcodes_7x = require('./../Test_cases/opcodes_7x.js');
const opcodes_8x = require('./../Test_cases/opcodes_8x.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


module.exports = class CANServiceTests {

    constructor(NETWORK) {
		this.network = NETWORK;
		this.Title = 'CAN Service';
		
		this.opcodes_5x = new opcodes_5x(this.network);
		this.opcodes_7x = new opcodes_7x(this.network);
		this.opcodes_8x = new opcodes_8x(this.network);
    }


    async runTests(RetrievedValues, module_descriptor, serviceIndex) {
		utils.DisplayStartDivider(this.Title + ' tests');
		
			// only do tests if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){

				// this will get all the services that this module supports
				await this.opcodes_7x.test_RQSD(RetrievedValues, serviceIndex);
								
				// now request diagnostics just for this service
				await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, 0);
/*
//
// CANID & ENUM no longer supported
//
				// now test CANID
        // use previously captured CANID, so the test is non-destructive
				await this.opcodes_7x.test_CANID(RetrievedValues, RetrievedValues.data.CANID);

        // now test CANID_INVALID_VALUE
				await this.opcodes_7x.test_CANID_INVALID_VALUE(RetrievedValues, 0);

        // now test CANID_INVALID_VALUE
				await this.opcodes_7x.test_CANID_INVALID_VALUE(RetrievedValues, 100);

        // now test CANID_INVALID_VALUE
				await this.opcodes_7x.test_CANID_INVALID_VALUE(RetrievedValues, 255);

        // now test CANID_SHORT
				await this.opcodes_7x.test_CANID_SHORT(RetrievedValues, 1);
				
				// now test ENUM
				await this.opcodes_5x.test_ENUM(RetrievedValues);
*/

			} else {
				winston.info({message: 'VLCB: tests aborted - invalid module descriptor file'});
			}
		
		utils.DisplayEndDivider(this.Title + ' tests finished');
		return RetrievedValues;
    }


}

