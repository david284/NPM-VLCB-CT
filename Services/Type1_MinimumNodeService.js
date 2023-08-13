'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');

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


exports.MinimumNodeServiceTests  = class MinimumNodeServiceTests{

    constructor(NETWORK) {
		this.network = NETWORK;
		this.Title = 'Minimum Node Service';
		
		this.opcodes_0x = new opcodes_0x(this.network);
		this.opcodes_4x = new opcodes_4x(this.network);
		this.opcodes_5x = new opcodes_5x(this.network);
		this.opcodes_7x = new opcodes_7x(this.network);
		this.opcodes_8x = new opcodes_8x.opcodes_8x(this.network);
    }



    async runTests(RetrievedValues, module_descriptor){
		utils.DisplayStartDivider(this.Title + ' tests');
			
			// now do rest of 'normal' opcodes, but only if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){
				
				// check for response to QNN from module under test
				await this.opcodes_0x.test_QNN(RetrievedValues);
				
				// now get node parameter 0, as it tells us how many more node parameters there are
				// we don't get that info from the RQNP command unfortunately
				await this.opcodes_7x.test_RQNPN(RetrievedValues, module_descriptor, 0);
				
				// now retrieve all the other node parameters, and check against module_descriptor file
				//using value now stored in parameter 0
				for (var i=1; i<RetrievedValues.data["nodeParameters"]["0"].value+1; i++) {
					await this.opcodes_7x.test_RQNPN(RetrievedValues, module_descriptor, i);
				}
				
				// now test the last node parameter + 1, expecting an error message
				await this.opcodes_7x.test_RQNPN_INVALID_INDEX(RetrievedValues, module_descriptor, RetrievedValues.data["nodeParameters"]["0"].value+1);

				// now test a short RQNPN message, expecting an error message
				await this.opcodes_7x.test_RQNPN_SHORT(RetrievedValues, module_descriptor, 1);
				
				// this will get all the services that this module supports
				// 
				await this.opcodes_7x.test_RQSD(RetrievedValues, 0);
								
				// test the error returned with invalid service index
				// so use reported maximum service index plus 1 for service index
				await this.opcodes_7x.test_RQSD_INVALID_SERVICE(RetrievedValues, RetrievedValues.data.MaxServiceIndex+1);
								
				// test the error returned with short message
				await this.opcodes_7x.test_RQSD_SHORT(RetrievedValues, 1);
								
				// request all the diagnostics, for all services, not just MNS
				await this.opcodes_8x.test_RDGN(RetrievedValues, 0, 0);

				// request the diagnostics for an invalid service, test the error return
				await this.opcodes_8x.test_RDGN_INVALID_SERVICE(RetrievedValues, RetrievedValues.data.MaxServiceIndex+1, 0);

				// request the diagnostics with a short message, expect an error
				await this.opcodes_8x.test_RDGN_SHORT(RetrievedValues, 0, 0);

				// now do MNS specific service tests, that rely on the serviceIndex value
				for (var key in RetrievedValues.data["Services"]) {
					var serviceIndex = RetrievedValues.data["Services"][key]["ServiceIndex"];
					var serviceType = RetrievedValues.data["Services"][key]["ServiceType"];
					if (serviceType == 1) {
						
						// this will get the extended data for this service
						await this.opcodes_7x.test_RQSD(RetrievedValues, serviceIndex);
								
						// now request diagnostics just for MNS
						await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, 0);
				
						// now request first diagnostic code just for MNS
						await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, 1);

						// use MaxDiagnosticCode for next tests, but only if it has been reported
						if (RetrievedValues.data.Services[key].MaxDiagnosticCode != undefined){

  						// now request last diagnostic code just for MNS
	  					await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, RetrievedValues.data.Services[key].MaxDiagnosticCode);
  						// test the error returned with invalid diagnostic code
              await this.opcodes_8x.test_RDGN_INVALID_DIAG(RetrievedValues, serviceIndex, RetrievedValues.data.Services[key].MaxDiagnosticCode + 1);
						} else {
							winston.info({message: 'VLCB: test_RDGN_INVALID_DIAG test skipped - no reported diagnostic codes'});
						}				

						// NNRST - node reset - check the uptime values after reset to see if the unit has actually reset
						await this.opcodes_5x.test_NNRST(RetrievedValues, serviceIndex);

					}
				}

				// NNRSM - node return to manufaturer defaults - should retain node number
        // just check we get an acknowledge (GRSP) to this command
//        await this.opcodes_4x.test_NNRSM(RetrievedValues);
				
				//
				// Add more tests.......
				//
				
			} else {
				winston.info({message: 'VLCB: tests aborted - invalid module descriptor file'});
			}
		
		utils.DisplayEndDivider(this.Title + ' tests finished');
		return RetrievedValues;
    }


}

