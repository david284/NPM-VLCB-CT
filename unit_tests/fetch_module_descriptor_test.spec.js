'use strict';
const itParam = require('mocha-param');
const expect = require('chai').expect;
const assert = require('chai').assert;
const winston = require('./config/winston_test.js');

const fs = require('fs')
const fetch_file = require('./../fetch_module_descriptor.js')

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block scope (like let), but can't be changed through reassigment or redeclared


describe('fetch_module_descriptor tests', function(){

	before(function() {
		winston.info({message: ' '});
		winston.info({message: '======================================================================'});
		winston.info({message: '----------------------- fetch_module_descriptor unit tests -------------------'});
		winston.info({message: '======================================================================'});
		winston.info({message: ' '});


	})
    
    beforeEach (function() {
   		winston.info({message: ' '});   // blank line to separate tests
    })

	after(function(done) {
        // bit of timing to ensure all winston messages get sent before closing tests completely
		setTimeout(function(){
            // timeout to allow tests to print
            winston.info({message: ' '});   // blank line to separate tests
            winston.info({message: 'UNIT TEST: tests finished '});
            setTimeout(function(){
                    // timeout to allow the finish text above to print
                     done();
            }, 100);
		}, 100);
    });



    //
	it("test_module_descriptor_read_pass", function () {
		
		// setup module variables
		var retrieved_values = {};
		retrieved_values["NAME"] = 'CANTEST'; 
		retrieved_values["nodeParameters"] = { };
		retrieved_values["nodeParameters"]["1"] = '165'; 
		retrieved_values["nodeParameters"]["7"] = '2';
		retrieved_values["nodeParameters"]["2"]  = '117';
		
        var module_descriptor = fetch_file.module_descriptor('./unit_tests/module_descriptors/', retrieved_values);
        assert.exists(module_descriptor, 'module_descriptor is either `null` nor `undefined`');
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor)}`});
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor.nodeParameters["0"].name)}`});
        winston.info({message: 'UNIT TEST: module_descriptor_read ended'});
    })

	it("test_module_descriptor_read_fail", function () {
		// setup module variables

		var retrieved_values = {};
		retrieved_values["NAME"] = 'UNKNOWN'; 
		retrieved_values["nodeParameters"] = { };
		retrieved_values["nodeParameters"]["1"] = '165'; 
		retrieved_values["nodeParameters"]["7"] = '2';
		retrieved_values["nodeParameters"]["2"]  = '117';

        var module_descriptor = fetch_file.module_descriptor('./unit_tests/module_descriptors/', retrieved_values);
		winston.debug({message: `UNIT TEST: Module Descriptor : ${JSON.stringify(module_descriptor)}`});
		
        assert.notExists(module_descriptor, 'module_descriptor is neither `null` nor `undefined`');

        winston.info({message: 'UNIT TEST: module_descriptor_read ended'});
    })


})