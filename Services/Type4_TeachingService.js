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


module.exports = class TeachingServiceTests {

    constructor(NETWORK) {
		this.network = NETWORK;
		this.Title = 'Teaching Service';
		
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

				// now request number of event spaces left
				await this.opcodes_5x.test_NNEVN(RetrievedValues, serviceIndex);
        // save value for later use
        var initialEventSpaceLeft = RetrievedValues.data.Services[serviceIndex].EventSpaceLeft

				// now request number of events stored
				await this.opcodes_5x.test_RQEVN(RetrievedValues, serviceIndex);
        // save value for later use
        var initialStoredEventCount = RetrievedValues.data.Services[serviceIndex].StoredEventCount

        //put module into learn mode
				await this.opcodes_5x.test_NNLRN(RetrievedValues);
        
        if(RetrievedValues.data.inLearnMode){

          // following tests only possible in learn mode
          
          utils.DisplayComment("now in Learn mode")

          // add new event & event variable #1
          await this.opcodes_Dx.test_EVLRN(RetrievedValues, "01000200", 1, 1);
          
          // now request all events stored, as we know there should be at least one event
          await this.opcodes_5x.test_NERD(RetrievedValues);
        
          // update last event variable with it's own index number
          // number of event variables in node parameter 5
          var eventVariableCount = RetrievedValues.data.nodeParameters[5].value
          await this.opcodes_Dx.test_EVLRN(RetrievedValues, "01000200", eventVariableCount, eventVariableCount);
          
          // now test response to invalid event variable index, but only if there is an invalid index (i.e. there are less than 255 indexes supported)
          if (eventVariableCount < 255) {
            // check error response to first invalid event variable index
            await this.opcodes_Dx.test_EVLRN_INVALID_INDEX(RetrievedValues, "01000200", eventVariableCount+1, 1);
            // check error response to last invalid event variable index
            await this.opcodes_Dx.test_EVLRN_INVALID_INDEX(RetrievedValues, "01000200", 255, 1);
          }

          // check EVLRN_SHORT error response
          await this.opcodes_Dx.test_EVLRN_SHORT(RetrievedValues, "01000200", 1, 1);

          // now request all events stored, as a double check
          await this.opcodes_5x.test_NERD(RetrievedValues);

          // now request number of events stored
          await this.opcodes_5x.test_RQEVN(RetrievedValues, serviceIndex);
          
          utils.DisplayComment('number of events - before ' + initialStoredEventCount + ' now ' + RetrievedValues.data.Services[serviceIndex].StoredEventCount)

          // now read back event variables just added
          await this.opcodes_Bx.test_REQEV(RetrievedValues, "01000200", 1);
          await this.opcodes_Bx.test_REQEV(RetrievedValues, "01000200", eventVariableCount);
          // test REQEV invalid event
          await this.opcodes_Bx.test_REQEV_INVALID_EVENT(RetrievedValues, "FF00FF00", 1);
          
          // now test response to invalid event variable index, but only if there is an invalid index (i.e. there are less than 255 indexes supported)
          if (eventVariableCount < 255) {
            // test REQEV first invalid event variable index
            await this.opcodes_Bx.test_REQEV_INVALID_INDEX(RetrievedValues, "01000200", eventVariableCount+1);
            // test REQEV last invalid event variable index
            await this.opcodes_Bx.test_REQEV_INVALID_INDEX(RetrievedValues, "01000200", 255);
          }
          
          // test REQEV short message
          await this.opcodes_Bx.test_REQEV_SHORT(RetrievedValues, "01000200", 1);
          
          // remove added event event
          await this.opcodes_9x.test_EVULN(RetrievedValues, "01000200");
          
          // now request number of events stored so we can check if event has been removed
          await this.opcodes_5x.test_RQEVN(RetrievedValues, serviceIndex);
          
          utils.DisplayComment('number of events - before ' + initialStoredEventCount + ' now ' + RetrievedValues.data.Services[serviceIndex].StoredEventCount)

          // now fill the event store, so we can test exceeding the storage limit
          // number of events supported is in node parameter[4]
          utils.DisplayComment("Starting process to completely fill stored events table")
          var numEventsToAdd = RetrievedValues.data.nodeParameters[4].value - RetrievedValues.data.Services[serviceIndex].StoredEventCount
          for (var i = 1; i <= numEventsToAdd; i++) {
            var eventIdentifier = "F000" + utils.decToHex(i, 4)
            await this.opcodes_Dx.test_EVLRN(RetrievedValues, eventIdentifier, 1, 1);
          }
          // now request number of events stored
          await this.opcodes_5x.test_RQEVN(RetrievedValues, serviceIndex);          
          utils.DisplayComment("stored events table should now be fully populated with " + RetrievedValues.data.nodeParameters[4].value + " events")

          // event store should now be full, so expect an error reponse when adding another
          await this.opcodes_Dx.test_EVLRN_INVALID_EVENT(RetrievedValues, "FFF00000", 1, 1);

          // check EVULN invalid event error response
          await this.opcodes_9x.test_EVULN_INVALID_EVENT(RetrievedValues, "FFF0FFF0");
          
          
          // check EVULN short message error response
          await this.opcodes_9x.test_EVULN_SHORT(RetrievedValues, "FFF0FFF0");
          
          
          // before leaving learn mode, test erase all events
          await this.opcodes_5x.test_NNCLR(RetrievedValues);
          
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

			} else {
				winston.info({message: 'VLCB: tests aborted - invalid module descriptor file'});
			}
		
		utils.DisplayEndDivider(this.Title + ' tests finished');
		return RetrievedValues;
    }


}

