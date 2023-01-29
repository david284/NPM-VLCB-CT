'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

const opcodes_0x = require('./../opcodes/opcodes_0x.js');
const opcodes_4x = require('./../opcodes/opcodes_4x.js');
const opcodes_5x = require('./../opcodes/opcodes_5x.js');
const opcodes_7x = require('./../opcodes/opcodes_7x.js');
const opcodes_8x = require('./../opcodes/opcodes_8x.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


class MinimumNodeServiceTests {

    constructor(NETWORK) {
		this.network = NETWORK;
		
		this.opcodes_0x = new opcodes_0x.opcodes_0x(this.network);
		this.opcodes_4x = new opcodes_4x.opcodes_4x(this.network);
		this.opcodes_5x = new opcodes_5x.opcodes_5x(this.network);
		this.opcodes_7x = new opcodes_7x.opcodes_7x(this.network);
		this.opcodes_8x = new opcodes_8x.opcodes_8x(this.network);
    }



    async runTests(RetrievedValues, module_descriptor) {
		winston.debug({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.debug({message: '==========================================================='});
		winston.info({message:  '--------------- Minimum Node Service tests ----------------'});
		winston.debug({message: '==========================================================='});
		winston.debug({message: ' '});
			
//		winston.debug({message: 'MERGLCB: MNS : RetrievedValues.data ' + JSON.stringify(RetrievedValues.data)});
//		winston.debug({message: 'MERGLCB: MNS : Module Descriptor ' + JSON.stringify(module_descriptor)});

			// now do rest of 'normal' opcodes, but only if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){
				

				// NNRST - node reset - just check we get an acknowledge (GRSP) to this command
//				await this.opcodes_5x.test_NNRST(RetrievedValues.data);
				
				// NNRSM - node return to manufaturer defaults - just check we get an acknowledge (GRSP) to this command
//				await this.opcodes_4x.test_NNRSM(RetrievedValues.data);
				
				// check for response to QNN from module under test
				await this.opcodes_0x.test_QNN(RetrievedValues.data);
				
				// now get node parameter 0, as it tells us how many more node parameters there are
				// we don't get that info from the RQNP command unfortunately
				await this.opcodes_7x.test_RQNPN(RetrievedValues, module_descriptor, 0);
				
				// now retrieve all the other node parameters, and check against module_descriptor file
				//using value now stored in parameter 0
				for (var i=1; i<RetrievedValues.data["nodeParameters"]["0"].value+1; i++) {
					await this.opcodes_7x.test_RQNPN(RetrievedValues, module_descriptor, i);
				}
				
				// this will get all the services that this module supports
				await this.opcodes_7x.test_RQSD(RetrievedValues, 0);
								
				// request all the diagnostics, for all services, not just MNS
				await this.opcodes_8x.test_RDGN(RetrievedValues, 0, 0);

				// now do MNS specific service tests, that rely on the serviceIndex value
				for (var key in RetrievedValues.data["Services"]) {
					var serviceIndex = RetrievedValues.data["Services"][key]["ServiceIndex"];
					var serviceType = RetrievedValues.data["Services"][key]["ServiceType"];
					if (serviceType == 1) {
						
						// this will get the extended data for this service
						await this.opcodes_7x.test_RQSD(RetrievedValues, serviceIndex);
								
						// now request diagnostics just for MNS
						await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, 0);
				
					}
				}

				//
				// Add more tests.......
				//
				
			} else {
				winston.info({message: 'MERGLCB: tests aborted - invalid module descriptor file'});
			}
		
        winston.info({message: 'MERGLCB: ==== MNS Test run finished \n'});
		
//		winston.debug({message: 'MERGLCB: MNS : RetrievedValues.data ' + JSON.stringify(RetrievedValues.data, null, "    ")});
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
    MinimumNodeServiceTests: MinimumNodeServiceTests
}