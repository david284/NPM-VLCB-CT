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
	
            
  test_harness(RetrievedValues)  {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'VLCB: BEGIN test_harness test case'});
      this.hasTestPassed = false;
			// would typically be sending a command to the module under test here
			
      setTimeout(()=>{
				// would typically be checking that a response has been received from the module under test here
        this.test_function();
				this.passed_count++;
				this.hasTestPassed = true;
        utils.processResult(RetrievedValues, this.hasTestPassed, 'test_harness');
        resolve(this.hasTestPassed);
      ;} , this.defaultTimeout  );
    }.bind(this));
  }

  test_function(){
    winston.debug({message: 'VLCB: test_function'});
  }
	
  async test_wait(RetrievedValues)  {
      winston.debug({message: 'VLCB: BEGIN test_wait test case'});
      this.hasTestPassed = false;
			// would typically be sending a command to the module under test here

      for (var i =0; i<5; i++){
        await utils.sleep(1000);
      }

      this.hasTestPassed = true;
      utils.processResult(RetrievedValues, this.hasTestPassed, 'test_wait');
    }

}

