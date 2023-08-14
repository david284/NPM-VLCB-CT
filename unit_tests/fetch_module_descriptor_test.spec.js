'use strict';
const itParam = require('mocha-param');
const expect = require('chai').expect;
const assert = require('chai').assert;
const winston = require('./config/winston_test.js');
const fs = require('fs')
let RetrievedValues = require('./../RetrievedValues.js');
const fetch_file = require('./../fetch_module_descriptor.js')
const NodeParameterNames = require('./../Definitions/Text_NodeParameterNames.js');
const utils = require('./../utilities.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), but can't be changed through reassigment or redeclared


describe('fetch_module_descriptor unit tests', function(){

	before(function() {
    utils.DisplayUnitTestHeader('fetch_module_descriptor unit tests');
	})
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
        // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
            // timeout to allow tests to print
            utils.DisplayUnitTestFooter('fetch_module_descriptor unit tests finished');
            setTimeout(function(){
                    // timeout to allow the finish text above to print
                     done();
            }, 100);
		}, 100);
    });



    //
	it("test_module_descriptor_read_pass", function () {
    winston.info({message: 'UNIT TEST: BEGIN module_descriptor_read_pass'});
		// setup module variables
		RetrievedValues.data["NAME"] = 'TEST'; 
		RetrievedValues.data["nodeParameters"]["1"] = { "value": '165', "name": NodeParameterNames[1] };
		RetrievedValues.data["nodeParameters"]["3"] = { "value": '255', "name": NodeParameterNames[3] };
		RetrievedValues.data["nodeParameters"]["7"] = { "value": '2', "name": NodeParameterNames[7] };
		RetrievedValues.data["nodeParameters"]["2"]  = { "value": '117', "name": NodeParameterNames[2] };

    var module_descriptor = fetch_file.module_descriptor('./unit_tests/module_descriptors/', RetrievedValues);
    assert.exists(module_descriptor, 'test module_descriptor exists');
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor, null, "    ")}`});
    winston.info({message: 'UNIT TEST: END module_descriptor_read_pass'});
  })

	it("test_module_descriptor_read_fail", function () {
    winston.info({message: 'UNIT TEST: BEGIN module_descriptor_read_fail'});
		// setup module variables
		RetrievedValues.data["NAME"] = 'UNKNOWN'; 
		RetrievedValues.data["nodeParameters"]["1"] = { "value": '165', "name": NodeParameterNames[1]};
		RetrievedValues.data["nodeParameters"]["7"] = { "value": '2' , "name": NodeParameterNames[7]};
		RetrievedValues.data["nodeParameters"]["2"]  = { "value": '117' , "name": NodeParameterNames[2]};
		
		// delete existing file if there
		try {
			fs.unlinkSync('./unit_tests/module_descriptors/UNKNOWN_165_2_117.json')
		} catch (err) {
		}

    var module_descriptor = fetch_file.module_descriptor('./unit_tests/module_descriptors/', RetrievedValues);
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor, null, "    ")}`});
		
    assert.exists(module_descriptor, 'test module_descriptor exists');
    winston.info({message: 'UNIT TEST: END module_descriptor_read_fail'});
  })


})