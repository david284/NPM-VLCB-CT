'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');

const opcodes_5x = require('./../opcodes/opcodes_5x.js');
const opcodes_7x = require('./../opcodes/opcodes_7x.js');
const opcodes_8x = require('./../opcodes/opcodes_8x.js');
const opcodes_Dx = require('./../opcodes/opcodes_Dx.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


class TeachingServiceTests {

    constructor(NETWORK) {
		this.network = NETWORK;
		this.Title = 'Teaching Service';
		
		this.opcodes_5x = new opcodes_5x.opcodes_5x(this.network);
		this.opcodes_7x = new opcodes_7x.opcodes_7x(this.network);
		this.opcodes_8x = new opcodes_8x.opcodes_8x(this.network);
		this.opcodes_Dx = new opcodes_Dx.opcodes_Dx(this.network);
    }


    async runTests(RetrievedValues, module_descriptor, serviceIndex) {
		utils.DisplayStartDivider(this.Title + ' tests');
		
			// only do tests if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){

				// this will get all the services that this module supports
				await this.opcodes_7x.test_RQSD(RetrievedValues, serviceIndex);
								
				// now request diagnostics just for this service
				await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, 0);

				// now request number of event spaces left
				await this.opcodes_5x.test_NNEVN(RetrievedValues, serviceIndex);
        // save value for later use
        var initialEventSpaceLeft = RetrievedValues.data.Services[serviceIndex].EventSpaceLeft

				// now request number of events stored
				await this.opcodes_5x.test_RQEVN(RetrievedValues, serviceIndex);
        // save value for later use
        var initialStoredEventCount = RetrievedValues.data.Services[serviceIndex].StoredEventCount

				// now request all events stored
				await this.opcodes_5x.test_NERD(RetrievedValues, serviceIndex);
        
        //put module into learn mode
				await this.opcodes_5x.test_NNLRN(RetrievedValues);
        
        if(RetrievedValues.data.inLearnMode){
          // tests only possible in learn mode
          winston.info({message: 'VLCB:      --- now in Learn mode ---'});          

          // add new event
          await this.opcodes_Dx.test_EVLRN(RetrievedValues, serviceIndex, "01000200", 1, 2);
          
          // now request number of events stored
          await this.opcodes_5x.test_RQEVN(RetrievedValues, serviceIndex);
          
          winston.info({message: 'VLCB:      number of events - before ' + initialStoredEventCount +
                                            ' now ' + RetrievedValues.data.Services[serviceIndex].StoredEventCount});          
          
          //
        } else {
          winston.info({message: 'VLCB:      FAIL: tests skipped - failed to go into Learn mode'});          
        }
        
        // take module out of learn mode
				await this.opcodes_5x.test_NNULN(RetrievedValues);

        if(!RetrievedValues.data.inLearnMode){
          // tests only possible in learn mode
          winston.info({message: 'VLCB:      --- back out of Learn mode ---'});
        } else {
          winston.info({message: 'VLCB:      FAIL: failed to exit Learn mode'});          
        }

        
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

module.exports = {
    TeachingServiceTests: TeachingServiceTests
}