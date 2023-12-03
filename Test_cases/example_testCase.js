'use strict';
const BaseTestCase = require('./../Test_cases/BaseTestCase.js');
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const utils = require('./../utilities.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared

// extends base class as example of how to do it - but not used

module.exports = class example_testCase  extends BaseTestCase{

  constructor(NETWORK) {
    //  Must call super constructor in derived class before accessing 'this' or returning from derived constructor
		super();
    //
    //                        0123456789012345678901234567890123456789
    winston.debug({message:  '----------------- example_testCase Constructor'});
		this.hasTestPassed = false;
    this.defaultTimeout = 250;
  }
	
            
  async test_harness(RetrievedValues)  {
    winston.debug({message: 'VLCB: BEGIN test_harness test case'});
    this.hasTestPassed = false;
    // would typically be sending a command to the module under test here
    
    var startTime = Date.now();
    // set maximum wait as 1 second, unless local unit tests running...
    var timeout = 1000;
    if (RetrievedValues.data.unitTestsRunning){timeout = 30 }   // cut down timeout as local unit tests
    while(Date.now()-startTime < timeout) {
      await utils.sleep(10);
      // would typically be checking that a response has been received from the module under test here
      this.test_function();
      this.passed_count++;
      this.hasTestPassed = true;
      // would loop until timeout or break out early if test passed 
      if(this.hasTestPassed){ break; }
    }
    utils.processResult(RetrievedValues, this.hasTestPassed, 'test_harness');
    return this.hasTestPassed
  }

  test_function(){
    winston.debug({message: 'VLCB: test_function'});
  }
	
  async test_wait(RetrievedValues)  {
      winston.debug({message: 'VLCB: BEGIN test_wait test case'});
      this.hasTestPassed = false;
			// would typically be sending a command to the module under test here

      var startTime = Date.now();
      while(Date.now()-startTime < 100) {
        await utils.sleep(10);
        var t = Date.now()-startTime
        winston.debug({message: 'VLCB: elapsed time ' + t});
//        break;
      }

      this.hasTestPassed = true;
      utils.processResult(RetrievedValues, this.hasTestPassed, 'test_wait');
    }

}

