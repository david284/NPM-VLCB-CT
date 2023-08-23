'use strict';
const winston = require('winston');		// use config from root instance
const BaseTestSuite = require('./../Test_suites/BaseTestSuite.js');
const utils = require('./../utilities.js');
const example_tests = require('./../Test_cases/example_testCase.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), and can't be changed through reassigment or redeclared


// extends base class as example of how to do it - but not used

module.exports = class example_testSuite extends BaseTestSuite{

  constructor() {
		super();
		this.Title = 'example_testSuite';

    this.example = new example_tests();

  }

	//
	// runTests is an async function so that the 'await' command can be used
	// This is need to ensure that the flow  waits for each test to complete before moving to the next test
	// Each test typically has a timeout to wait for a response from the module under test
	//
  async runTests(RetrievedValues) {
    utils.DisplayStartDivider(this.Title + ' tests');
		

    await this.sleep(1000);								// example of a delay
    await this.example.test_harness(RetrievedValues);
		
		utils.DisplayEndDivider(this.Title + ' tests finished');
		return RetrievedValues;
  }





  sleep(timeout) {
    return new Promise(function (resolve, reject) {
      winston.debug({message: 'BEGIN sleep ' + timeout});
      //here our function should be implemented 
      setTimeout(()=>{
        winston.debug({message: 'END sleep ' + timeout});
        resolve();
      }, timeout )
    });
  }
	

}

