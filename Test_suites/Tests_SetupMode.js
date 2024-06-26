'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');

const opcodes_0x = require('./../Test_cases/opcodes_0x.js');
const opcodes_1x = require('./../Test_cases/opcodes_1x.js');
const opcodes_4x = require('./../Test_cases/opcodes_4x.js');
const opcodes_5x = require('./../Test_cases/opcodes_5x.js');
const opcodes_7x = require('./../Test_cases/opcodes_7x.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

const name='SetupMode_tests'

module.exports = class SetupMode_tests {

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
		this.opcodes_7x = new opcodes_7x(this.network);
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

      if (RetrievedValues.getNodeNumber() > 0){
        await this.opcodes_7x.test_MODE(RetrievedValues, 0)
      }

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

        // consider it completed if we exit setup succesfully using SNN
        // but we need a valid node number first
        // use value returned by node if valid (>0)
        if (RetrievedValues.getNodeNumber() == 0) {
          // if 0, then module was uninitialised, so get next free node number
          RetrievedValues.setNodeNumber(this.getNextFreeNodeNumber(9000, RetrievedValues))
        }
        
        RetrievedValues.data.setup_completed = await this.opcodes_4x.test_SNN(RetrievedValues);      // takes module out of setup mode

        // now setup mode completed, we should have retrieved all the identifying info about the module (RQMN & RQNP)

      } else {
        winston.info({message: 'VLCB:'});
        winston.info({message: 'VLCB: FAIL - failed to go into setup'});
        RetrievedValues.data.TestsFailed++;
      }
		
      utils.DisplayEndDivider(this.Title + ' tests finished');
      
      winston.debug({message: 'VLCB: Setup Mode : RetrievedValues \n' + JSON.stringify(RetrievedValues.data, null, "    ")});
      return RetrievedValues;
    }


    getNextFreeNodeNumber(baseNodeNumber, RetrievedValues) {
      var freeNode = 0
      var nodes = Object.keys(RetrievedValues.data.modules)  // just get node numbers
      // loop through all node numbers starting at base, checking it it already exists
      for (var i = baseNodeNumber; i < 65535; i++){
        if (nodes.includes(i.toString())) {
          //console.log(name + " node number match: " + i)
          // found node, so not free
        } else {
          winston.info({message: name + " first free node number: " + i});
          freeNode = i
          break
        }
      }
      return freeNode
    }
    
    
}

