'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

const opcodes_7x = require('./../opcodes/opcodes_7x.js');
const opcodes_8x = require('./../opcodes/opcodes_8x.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


class ProducerServiceTests {

    constructor(NETWORK) {
		this.network = NETWORK;
		
		this.opcodes_7x = new opcodes_7x.opcodes_7x(this.network);
		this.opcodes_8x = new opcodes_8x.opcodes_8x(this.network);
    }


    async runTests(RetrievedValues, module_descriptor, serviceIndex) {
		winston.debug({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.debug({message: '==========================================================='});
		winston.info({message:  '----------------- Producer Service tests ------------------'});
		winston.debug({message: '==========================================================='});
		winston.debug({message: ' '});
		
		// Producer service - Type 5

			// only do tests if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){

				// this will get all the services that this module supports
				await this.opcodes_7x.test_RQSD(RetrievedValues, serviceIndex);
								
				// now request diagnostics just for this service
				await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, 0);

				//
				// Add more tests.......
				//
				
			} else {
				winston.info({message: 'MERGLCB: tests aborted - invalid module descriptor file'});
			}
		
        winston.info({message: 'MERGLCB: ==== Producer Service Test run finished \n'});
		
//		winston.debug({message: 'MERGLCB: PS : RetrievedValues.data ' + JSON.stringify(RetrievedValues.data, null, "    ")});
		return RetrievedValues;
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
    ProducerServiceTests: ProducerServiceTests
}