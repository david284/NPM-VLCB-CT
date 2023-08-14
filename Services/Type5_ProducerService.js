'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');

const opcodes_5x = require('./../opcodes/opcodes_5x.js');
const opcodes_7x = require('./../opcodes/opcodes_7x.js');
const opcodes_8x = require('./../opcodes/opcodes_8x.js');
const opcodes_9x = require('./../opcodes/opcodes_9x.js');
const opcodes_Bx = require('./../opcodes/opcodes_Bx.js');
const opcodes_Dx = require('./../opcodes/opcodes_Dx.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


class ProducerServiceTests {

    constructor(NETWORK) {
		this.network = NETWORK;
		this.Title = 'Producer Service';
		
		this.opcodes_5x = new opcodes_5x(this.network);
		this.opcodes_7x = new opcodes_7x(this.network);
		this.opcodes_8x = new opcodes_8x(this.network);
		this.opcodes_9x = new opcodes_9x(this.network);
		this.opcodes_Bx = new opcodes_Bx(this.network);
		this.opcodes_Dx = new opcodes_Dx(this.network);
    }


    async runTests(RetrievedValues, module_descriptor, serviceIndex) {
		utils.DisplayStartDivider(this.Title + ' tests');

			// only do tests if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){

				// this will get all the services that this module supports
				await this.opcodes_7x.test_RQSD(RetrievedValues, serviceIndex);
								
				// now request diagnostics just for this service
				await this.opcodes_8x.test_RDGN(RetrievedValues, serviceIndex, 0);

        //put module into learn mode
				await this.opcodes_5x.test_NNLRN(RetrievedValues);
        
        if(RetrievedValues.data.inLearnMode){

          // adding event only possible in learn mode
          
          utils.DisplayComment("now in Learn mode")

          // add new long event (512) & event variable #1
          var eventIdentifier = utils.decToHex(259, 4) + '0200'
          await this.opcodes_Dx.test_EVLRN(RetrievedValues, eventIdentifier, 1, 1);
          // add new 'spoofed' long event (65,280:512) & event variable #1
          await this.opcodes_Dx.test_EVLRN(RetrievedValues, 'ff000200', 1, 2);
          // add new short event (1024) & event variable #1
          await this.opcodes_Dx.test_EVLRN(RetrievedValues, "00000400", 1, 3);
          //
        } else {
          winston.info({message: 'VLCB:      FAIL: tests skipped - failed to go into Learn mode'});          
        }
        
        // take module out of learn mode
				await this.opcodes_5x.test_NNULN(RetrievedValues);

        if(!RetrievedValues.data.inLearnMode){
          utils.DisplayComment("back out of Learn mode")
        } else {
          winston.info({message: 'VLCB:      FAIL: failed to exit Learn mode'});          
        }
        
        // now request all events stored, so we can firm the events have been added
        await this.opcodes_5x.test_NERD(RetrievedValues);

        // get long event 512
        await this.opcodes_9x.test_AREQ(RetrievedValues, RetrievedValues.getNodeNumber(), 512);
        // get 'spoofed' long event (65,280:512)
        await this.opcodes_9x.test_AREQ(RetrievedValues, 65280, 512);
				// get short event 1024
        await this.opcodes_9x.test_ASRQ(RetrievedValues, RetrievedValues.getNodeNumber(), 1024);
        
			} else {
				winston.info({message: 'VLCB: tests aborted - invalid module descriptor file'});
			}
		
		utils.DisplayEndDivider(this.Title + ' tests finished');
		return RetrievedValues;
    }


}

module.exports = {
    ProducerServiceTests: ProducerServiceTests
}